"""
Algorithm and Experiment Comparison API endpoint.
Ranks algorithms explicitly by selected metric, displays variability, and computes trade-offs.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from app.database.session import get_db
from app.models.experiment import Experiment
from app.schemas.experiment import CompareRequest

router = APIRouter()

METRIC_CONFIG = {
    "goodput_mbps": {"name": "Application Goodput (Mbps)", "higher_is_better": True, "field": "mean_goodput_mbps"},
    "throughput_mbps": {"name": "Total Throughput (Mbps)", "higher_is_better": True, "field": "mean_throughput_mbps"},
    "avg_rtt_ms": {"name": "Average RTT (ms)", "higher_is_better": False, "field": "mean_avg_rtt_ms"},
    "p95_rtt_ms": {"name": "95th Percentile RTT (ms)", "higher_is_better": False, "field": "mean_p95_rtt_ms"},
    "total_drops": {"name": "Total Packet Drops", "higher_is_better": False, "field": "mean_total_drops"},
    "retransmissions": {"name": "Retransmissions", "higher_is_better": False, "field": "mean_retransmissions"},
    "utilization_pct": {"name": "Bandwidth Utilization (%)", "higher_is_better": True, "field": "mean_utilization_pct"},
    "jain_fairness": {"name": "Jain's Fairness Index", "higher_is_better": True, "field": "mean_jain_fairness"}
}

@router.post("/compare")
def compare_experiments(request: CompareRequest, db: Session = Depends(get_db)):
    """Compares multiple experiments or algorithms, ranking them strictly by the selected criterion."""
    experiments = db.query(Experiment).filter(Experiment.id.in_(request.experiment_ids)).all()
    if not experiments:
        raise HTTPException(status_code=404, detail="No matching experiments found for comparison.")

    metric_key = request.metric if request.metric in METRIC_CONFIG else "goodput_mbps"
    cfg = METRIC_CONFIG[metric_key]
    val_field = cfg["field"]
    higher_better = cfg["higher_is_better"]

    # Flatten algorithm outcomes across compared experiments
    comparison_items: List[Dict[str, Any]] = []
    
    for exp in experiments:
        metrics = exp.metrics_summary_json or {}
        for algo_id, m in metrics.items():
            metric_val = m.get(val_field)
            comparison_items.append({
                "experiment_id": exp.id,
                "experiment_title": exp.title,
                "scenario_name": exp.scenario_name,
                "algorithm_id": algo_id,
                "bandwidth_mbps": exp.bandwidth_mbps,
                "base_rtt_ms": exp.base_rtt_ms,
                "packet_loss_rate": exp.packet_loss_rate,
                "repetitions": exp.repetitions,
                "selected_metric_name": cfg["name"],
                "selected_metric_value": metric_val,
                "all_metrics": m
            })

    # Filter out None values before ranking
    rankable = [item for item in comparison_items if item["selected_metric_value"] is not None]
    unrankable = [item for item in comparison_items if item["selected_metric_value"] is None]

    rankable.sort(key=lambda x: x["selected_metric_value"], reverse=higher_better)

    ranked_list = []
    for rank_idx, item in enumerate(rankable, start=1):
        item_copy = dict(item)
        item_copy["rank"] = rank_idx
        ranked_list.append(item_copy)
        
    for item in unrankable:
        item_copy = dict(item)
        item_copy["rank"] = None
        ranked_list.append(item_copy)

    return {
        "ranking_criterion": cfg["name"],
        "higher_is_better": higher_better,
        "total_items": len(ranked_list),
        "results": ranked_list,
        "available_metrics": [
            {"id": k, "name": v["name"], "higher_is_better": v["higher_is_better"]}
            for k, v in METRIC_CONFIG.items()
        ]
    }
