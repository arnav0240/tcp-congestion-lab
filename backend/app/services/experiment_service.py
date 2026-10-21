"""
Experiment Orchestration and Simulation Execution Service.
Coordinates multiple trials, matches pseudo-random seeds, computes statistical aggregations,
and persists experiment records to the SQLite database.
"""
import statistics
import traceback
from typing import Dict, Any, List
from sqlalchemy.orm import Session

from app.models.experiment import Experiment, AlgorithmRun, TimeSeriesRecord
from app.schemas.experiment import ExperimentCreate
from app.simulation.engine import NetworkSimulator
from app.simulation.presets import SCENARIO_PRESETS
from app.simulation.metrics import calculate_jains_fairness_index
from app.simulation.ns3_runner import ns3_runner
from app.services.interpretation import generate_scientific_interpretation

def run_experiment_task(db: Session, exp_create: ExperimentCreate) -> Experiment:
    """Executes a full comparative TCP experiment across requested algorithms and trials."""
    scenario_info = SCENARIO_PRESETS.get(exp_create.scenario_id or "custom", SCENARIO_PRESETS["custom"])
    scenario_name = scenario_info.get("name", "Custom Scenario")
    
    # Create preliminary Experiment record in PENDING state
    db_exp = Experiment(
        title=exp_create.title or f"{scenario_name} Study",
        scenario_id=exp_create.scenario_id or "custom",
        scenario_name=scenario_name,
        execution_mode="educational_sim",
        simulator_name="Antigravity Discrete-Event Simulator",
        bandwidth_mbps=exp_create.bandwidth_mbps,
        base_rtt_ms=exp_create.base_rtt_ms,
        jitter_ms=exp_create.jitter_ms,
        packet_loss_rate=exp_create.packet_loss_rate,
        queue_limit_packets=exp_create.queue_limit_packets,
        duration_seconds=exp_create.duration_seconds,
        flow_count=exp_create.flow_count,
        background_traffic_ratio=exp_create.background_traffic_ratio,
        seed=exp_create.seed,
        repetitions=exp_create.repetitions,
        status="RUNNING",
        algorithms_json=exp_create.algorithms,
        metrics_summary_json={},
    )
    db.add(db_exp)
    db.commit()
    db.refresh(db_exp)

    try:
        # We will collect per-algorithm runs across repetitions
        algo_results_collector: Dict[str, List[Dict[str, Any]]] = {a: [] for a in exp_create.algorithms}
        last_time_series = []

        # If comparing algorithms in isolation under identical conditions:
        # For each algorithm, we run 'repetitions' trials
        bw_sched = [s.model_dump() for s in exp_create.bandwidth_schedule] if exp_create.bandwidth_schedule else []
        
        for trial_idx in range(exp_create.repetitions):
            matched_seed = exp_create.seed + (trial_idx * 1000)
            
            for algo_id in exp_create.algorithms:
                # Setup flows for this algorithm run
                flow_list = [algo_id] * exp_create.flow_count
                
                sim = NetworkSimulator(
                    bandwidth_mbps=exp_create.bandwidth_mbps,
                    base_rtt_ms=exp_create.base_rtt_ms,
                    jitter_ms=exp_create.jitter_ms,
                    packet_loss_rate=exp_create.packet_loss_rate,
                    queue_limit_packets=exp_create.queue_limit_packets,
                    duration_seconds=exp_create.duration_seconds,
                    flow_algorithms=flow_list,
                    background_traffic_ratio=exp_create.background_traffic_ratio,
                    bandwidth_schedule=bw_sched,
                    random_seed=matched_seed,
                    sample_interval=0.1
                )
                
                sim_res = sim.run()
                last_time_series = sim_res["time_series"]
                
                # Aggregate flow outcomes for this trial
                total_t = sim_res["total_throughput_mbps"]
                total_g = sim_res["total_goodput_mbps"]
                
                flows = list(sim_res["flows"].values())
                avg_rtt = sum(f["avg_rtt_ms"] for f in flows) / max(1, len(flows))
                avg_p95_rtt = sum(f["p95_rtt_ms"] for f in flows) / max(1, len(flows))
                total_q_drops = sum(f["queue_drops"] for f in flows)
                total_rnd_drops = sum(f["random_drops"] for f in flows)
                total_drops = total_q_drops + total_rnd_drops
                total_retx = sum(f["retransmissions"] for f in flows)
                
                # Loss rate percentage across all packets
                total_pkts = sum(max(1, f["throughput_mbps"] * exp_create.duration_seconds * 1e6 / (8.0 * 1500)) for f in flows)
                loss_pct = (total_drops / max(1, total_pkts)) * 100.0
                util_pct = (total_t / max(0.1, exp_create.bandwidth_mbps)) * 100.0

                trial_data = {
                    "algorithm_id": algo_id,
                    "trial_index": trial_idx,
                    "throughput_mbps": round(total_t, 3),
                    "goodput_mbps": round(total_g, 3),
                    "avg_rtt_ms": round(avg_rtt, 2),
                    "p95_rtt_ms": round(avg_p95_rtt, 2),
                    "queue_drops": total_q_drops,
                    "random_drops": total_rnd_drops,
                    "total_drops": total_drops,
                    "retransmissions": total_retx,
                    "loss_rate_pct": round(min(100.0, loss_pct), 3),
                    "utilization_pct": round(min(100.0, util_pct), 2),
                    "jain_fairness": sim_res["jain_fairness_index"]
                }
                algo_results_collector[algo_id].append(trial_data)
                
                # Save Run row to DB
                run_row = AlgorithmRun(
                    experiment_id=db_exp.id,
                    algorithm_id=algo_id,
                    flow_id=0,
                    trial_index=trial_idx,
                    throughput_mbps=trial_data["throughput_mbps"],
                    goodput_mbps=trial_data["goodput_mbps"],
                    avg_rtt_ms=trial_data["avg_rtt_ms"],
                    p95_rtt_ms=trial_data["p95_rtt_ms"],
                    queue_drops=trial_data["queue_drops"],
                    random_drops=trial_data["random_drops"],
                    total_drops=trial_data["total_drops"],
                    retransmissions=trial_data["retransmissions"],
                    loss_rate_pct=trial_data["loss_rate_pct"],
                    utilization_pct=trial_data["utilization_pct"]
                )
                db.add(run_row)

        # Compute Statistical Summary across Trials
        summary_by_algo = {}
        for algo_id, trials in algo_results_collector.items():
            if not trials:
                continue
            t_vals = [t["throughput_mbps"] for t in trials]
            g_vals = [t["goodput_mbps"] for t in trials]
            rtt_vals = [t["avg_rtt_ms"] for t in trials]
            p95_vals = [t["p95_rtt_ms"] for t in trials]
            drop_vals = [t["total_drops"] for t in trials]
            retx_vals = [t["retransmissions"] for t in trials]
            util_vals = [t["utilization_pct"] for t in trials]
            
            def mean_std(arr):
                m = sum(arr) / len(arr)
                s = statistics.stdev(arr) if len(arr) > 1 else 0.0
                return round(m, 3), round(s, 3), round(min(arr), 3), round(max(arr), 3)

            m_t, s_t, min_t, max_t = mean_std(t_vals)
            m_g, s_g, min_g, max_g = mean_std(g_vals)
            m_rtt, s_rtt, min_rtt, max_rtt = mean_std(rtt_vals)
            m_p95, s_p95, min_p95, max_p95 = mean_std(p95_vals)
            m_drop, s_drop, min_drop, max_drop = mean_std(drop_vals)
            m_retx, s_retx, min_retx, max_retx = mean_std(retx_vals)
            m_util, s_util, min_util, max_util = mean_std(util_vals)

            fairness_vals = [t["jain_fairness"] for t in trials if t["jain_fairness"] is not None]
            m_fairness = (sum(fairness_vals) / len(fairness_vals)) if fairness_vals else None

            summary_by_algo[algo_id] = {
                "algorithm_id": algo_id,
                "trials_count": len(trials),
                "mean_throughput_mbps": m_t,
                "std_throughput_mbps": s_t,
                "min_throughput_mbps": min_t,
                "max_throughput_mbps": max_t,
                "mean_goodput_mbps": m_g,
                "std_goodput_mbps": s_g,
                "min_goodput_mbps": min_g,
                "max_goodput_mbps": max_g,
                "mean_avg_rtt_ms": m_rtt,
                "std_avg_rtt_ms": s_rtt,
                "mean_p95_rtt_ms": m_p95,
                "mean_total_drops": m_drop,
                "mean_retransmissions": m_retx,
                "mean_utilization_pct": m_util,
                "mean_jain_fairness": round(m_fairness, 4) if m_fairness is not None else None,
            }

        # Generate rule-based automated scientific interpretation
        params = {
            "bandwidth_mbps": exp_create.bandwidth_mbps,
            "base_rtt_ms": exp_create.base_rtt_ms,
            "packet_loss_rate": exp_create.packet_loss_rate,
            "queue_limit_packets": exp_create.queue_limit_packets,
            "flow_count": exp_create.flow_count,
        }
        interpretation = generate_scientific_interpretation(
            scenario_name=scenario_name,
            parameters=params,
            algorithms_summary=summary_by_algo,
            execution_mode="educational_sim",
            repetitions=exp_create.repetitions
        )

        # Save Time Series Record
        ts_row = TimeSeriesRecord(
            experiment_id=db_exp.id,
            points_json=last_time_series
        )
        db.add(ts_row)

        # Update Experiment Record
        db_exp.status = "COMPLETED"
        db_exp.metrics_summary_json = summary_by_algo
        db_exp.automated_interpretation = interpretation
        db.commit()
        db.refresh(db_exp)
        return db_exp

    except Exception as exc:
        db.rollback()
        db_exp.status = "FAILED"
        db_exp.error_message = f"{str(exc)}\n{traceback.format_exc()}"
        db.commit()
        db.refresh(db_exp)
        return db_exp
