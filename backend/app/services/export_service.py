"""
Experiment Exporter Service.
Provides exports in CSV, JSON, and formatted research Markdown summary formats.
Guarantees scientific fidelity by serializing only authentic simulation measurements.
"""
import csv
import io
import json
from typing import Dict, Any, List
from app.models.experiment import Experiment

def export_experiment_json(experiment: Experiment) -> str:
    """Exports the complete experiment configuration, parameters, runs, metrics, and trace as JSON."""
    data = {
        "metadata": {
            "experiment_id": experiment.id,
            "created_at": experiment.created_at.isoformat() if experiment.created_at else None,
            "title": experiment.title,
            "scenario_id": experiment.scenario_id,
            "scenario_name": experiment.scenario_name,
            "execution_mode": experiment.execution_mode,
            "simulator_name": experiment.simulator_name,
            "status": experiment.status,
            "repetitions": experiment.repetitions,
            "seed": experiment.seed,
        },
        "network_parameters": {
            "bandwidth_mbps": experiment.bandwidth_mbps,
            "base_rtt_ms": experiment.base_rtt_ms,
            "jitter_ms": experiment.jitter_ms,
            "packet_loss_rate": experiment.packet_loss_rate,
            "queue_limit_packets": experiment.queue_limit_packets,
            "duration_seconds": experiment.duration_seconds,
            "flow_count": experiment.flow_count,
            "background_traffic_ratio": experiment.background_traffic_ratio,
        },
        "algorithms_evaluated": experiment.algorithms_json,
        "aggregate_metrics": experiment.metrics_summary_json,
        "automated_interpretation": experiment.automated_interpretation,
        "individual_runs": [
            {
                "algorithm_id": r.algorithm_id,
                "trial_index": r.trial_index,
                "flow_id": r.flow_id,
                "throughput_mbps": r.throughput_mbps,
                "goodput_mbps": r.goodput_mbps,
                "avg_rtt_ms": r.avg_rtt_ms,
                "p95_rtt_ms": r.p95_rtt_ms,
                "queue_drops": r.queue_drops,
                "random_drops": r.random_drops,
                "total_drops": r.total_drops,
                "retransmissions": r.retransmissions,
                "loss_rate_pct": r.loss_rate_pct,
                "utilization_pct": r.utilization_pct,
            }
            for r in experiment.runs
        ],
        "time_series": experiment.time_series_record.points_json if experiment.time_series_record else []
    }
    return json.dumps(data, indent=2)

def export_aggregate_metrics_csv(experiment: Experiment) -> str:
    """Exports aggregate performance comparisons by algorithm to CSV format."""
    output = io.StringIO()
    writer = csv.writer(output)
    
    headers = [
        "Algorithm",
        "Trials",
        "Mean Throughput (Mbps)",
        "StdDev Throughput (Mbps)",
        "Mean Goodput (Mbps)",
        "StdDev Goodput (Mbps)",
        "Mean Avg RTT (ms)",
        "StdDev Avg RTT (ms)",
        "Mean 95th Percentile RTT (ms)",
        "Mean Total Drops",
        "Mean Retransmissions",
        "Mean Bandwidth Utilization (%)",
        "Jain Fairness Index"
    ]
    writer.writerow(headers)
    
    metrics = experiment.metrics_summary_json or {}
    for algo_id, m in metrics.items():
        writer.writerow([
            algo_id.upper(),
            m.get("trials_count", 1),
            m.get("mean_throughput_mbps", 0.0),
            m.get("std_throughput_mbps", 0.0),
            m.get("mean_goodput_mbps", 0.0),
            m.get("std_goodput_mbps", 0.0),
            m.get("mean_avg_rtt_ms", 0.0),
            m.get("std_avg_rtt_ms", 0.0),
            m.get("mean_p95_rtt_ms", 0.0),
            m.get("mean_total_drops", 0.0),
            m.get("mean_retransmissions", 0.0),
            m.get("mean_utilization_pct", 0.0),
            m.get("mean_jain_fairness", "N/A"),
        ])
        
    return output.getvalue()

def export_timeseries_csv(experiment: Experiment) -> str:
    """Exports the fine-grained telemetry time series to CSV format."""
    output = io.StringIO()
    writer = csv.writer(output)
    
    headers = [
        "Timestamp (s)",
        "Total Throughput (Mbps)",
        "Router Queue (Packets)",
        "Queue Occupancy (%)",
        "Bottleneck Capacity (Mbps)",
        "Utilization (%)",
        "Algorithm",
        "Flow ID",
        "Flow Throughput (Mbps)",
        "Flow Goodput (Mbps)",
        "cwnd (Packets)",
        "Pacing Rate (Mbps)",
        "Measured RTT (ms)",
        "Queueing Delay (ms)",
        "In-Flight (Packets)",
        "Queue Drops",
        "Random Drops",
        "Retransmissions"
    ]
    writer.writerow(headers)
    
    ts_data = experiment.time_series_record.points_json if experiment.time_series_record else []
    for pt in ts_data:
        t = pt.get("timestamp", 0.0)
        tot_t = pt.get("total_throughput_mbps", 0.0)
        q_pkts = pt.get("router_queue_packets", 0)
        q_pct = pt.get("router_queue_pct", 0.0)
        bw = pt.get("bottleneck_bandwidth_mbps", 0.0)
        util = pt.get("utilization_pct", 0.0)
        
        flows = pt.get("flows", {})
        for fid, f in flows.items():
            writer.writerow([
                t, tot_t, q_pkts, q_pct, bw, util,
                f.get("algorithm", "").upper(),
                fid,
                f.get("throughput_mbps", 0.0),
                f.get("goodput_mbps", 0.0),
                f.get("cwnd", 0.0),
                f.get("pacing_rate_mbps", 0.0),
                f.get("rtt_ms", 0.0),
                f.get("queueing_delay_ms", 0.0),
                f.get("in_flight", 0),
                f.get("drops_queue", 0),
                f.get("drops_random", 0),
                f.get("retransmissions", 0),
            ])
            
    return output.getvalue()

def export_markdown_report(experiment: Experiment) -> str:
    """Generates an academic research experiment report formatted in clean Markdown."""
    m = experiment.metrics_summary_json or {}
    report = []
    report.append(f"# TCP Congestion Control Research Lab: Experiment Report")
    report.append(f"**Title:** {experiment.title}")
    report.append(f"**Experiment ID:** `{experiment.id}`")
    report.append(f"**Date:** {experiment.created_at.strftime('%Y-%m-%d %H:%M:%S UTC') if experiment.created_at else 'N/A'}")
    report.append(f"**Simulation Engine:** {experiment.simulator_name} ({experiment.execution_mode})")
    report.append("")
    report.append("## 1. Network Scenario Parameters")
    report.append(f"- **Scenario:** {experiment.scenario_name} (`{experiment.scenario_id}`)")
    report.append(f"- **Bottleneck Bandwidth:** {experiment.bandwidth_mbps} Mbps")
    report.append(f"- **Base Propagation RTT:** {experiment.base_rtt_ms} ms (Jitter: ±{experiment.jitter_ms} ms)")
    report.append(f"- **Packet Loss Rate:** {experiment.packet_loss_rate * 100:.2f}% (Independent non-congestive channel drop)")
    report.append(f"- **Router Buffer Limit:** {experiment.queue_limit_packets} packets (DropTail)")
    report.append(f"- **Duration:** {experiment.duration_seconds} seconds")
    report.append(f"- **Concurrent Flows:** {experiment.flow_count}")
    report.append(f"- **Background Traffic Ratio:** {experiment.background_traffic_ratio * 100:.1f}%")
    report.append(f"- **Trials (Repetitions):** {experiment.repetitions} (Base Seed: {experiment.seed})")
    report.append("")
    report.append("## 2. Quantitative Performance Summary")
    report.append("| Algorithm | Goodput (Mbps) | Avg RTT (ms) | 95th% RTT (ms) | Drops | Retransmissions | Utilization (%) | Fairness |")
    report.append("| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |")
    for a_id, data in m.items():
        report.append(
            f"| **{a_id.upper()}** | {data.get('mean_goodput_mbps', 0.0):.2f} ± {data.get('std_goodput_mbps', 0.0):.2f} | "
            f"{data.get('mean_avg_rtt_ms', 0.0):.1f} | {data.get('mean_p95_rtt_ms', 0.0):.1f} | "
            f"{data.get('mean_total_drops', 0)} | {data.get('mean_retransmissions', 0)} | "
            f"{data.get('mean_utilization_pct', 0.0):.1f}% | {data.get('mean_jain_fairness') or 'N/A'} |"
        )
    report.append("")
    report.append("## 3. Automated Scientific Analysis & Synthesis")
    report.append(experiment.automated_interpretation or "No interpretation generated.")
    report.append("")
    report.append("## 4. References & Standards")
    report.append("- RFC 5681: TCP Congestion Control (Allman, Paxson, Blanton)")
    report.append("- RFC 6582: The NewReno Modification to TCP's Fast Recovery (Henderson et al.)")
    report.append("- RFC 9438: CUBIC for Fast and Long-Distance Networks (Xu, Ha, Rhee, Goel, Eggert)")
    report.append("- Cardwell et al.: BBR: Congestion-Based Congestion Control (ACM Queue, 2016)")
    return "\n".join(report)
