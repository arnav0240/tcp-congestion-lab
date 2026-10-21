"""
Experiments management API endpoints.
Provides creation, listing, detail inspection, time-series telemetry retrieval, rerun, and deletion.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database.session import get_db
from app.models.experiment import Experiment, AlgorithmRun, TimeSeriesRecord
from app.schemas.experiment import (
    ExperimentCreate,
    ExperimentDetailResponse,
    ExperimentSummary,
    AlgorithmRunResponse,
)
from app.services.experiment_service import run_experiment_task

router = APIRouter()

@router.post("/experiments", response_model=ExperimentDetailResponse, status_code=201)
def create_experiment(exp_create: ExperimentCreate, db: Session = Depends(get_db)):
    """Validates parameters, executes simulation across requested algorithms, and saves persistent record."""
    exp = run_experiment_task(db, exp_create)
    return _build_detail_response(exp)

@router.get("/experiments", response_model=List[ExperimentSummary])
def list_experiments(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    scenario_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Lists persisted experiments with metadata and summary scores."""
    q = db.query(Experiment)
    if scenario_id:
        q = q.filter(Experiment.scenario_id == scenario_id)
    experiments = q.order_by(Experiment.created_at.desc()).offset(offset).limit(limit).all()
    
    summaries = []
    for e in experiments:
        m = e.metrics_summary_json or {}
        # Compute overall total throughput
        total_t = sum(item.get("mean_throughput_mbps", 0.0) for item in m.values()) if m else None
        # Retrieve fairness if multi-flow
        first_m = next(iter(m.values()), {}) if m else {}
        fairness = first_m.get("mean_jain_fairness")
        
        summaries.append(ExperimentSummary(
            id=e.id,
            created_at=e.created_at,
            title=e.title,
            scenario_id=e.scenario_id,
            scenario_name=e.scenario_name,
            execution_mode=e.execution_mode,
            status=e.status,
            bandwidth_mbps=e.bandwidth_mbps,
            base_rtt_ms=e.base_rtt_ms,
            packet_loss_rate=e.packet_loss_rate,
            queue_limit_packets=e.queue_limit_packets,
            duration_seconds=e.duration_seconds,
            repetitions=e.repetitions,
            algorithms=e.algorithms_json or [],
            total_throughput_mbps=round(total_t, 2) if total_t is not None else None,
            jain_fairness_index=fairness
        ))
    return summaries

@router.get("/experiments/{experiment_id}", response_model=ExperimentDetailResponse)
def get_experiment(experiment_id: str, db: Session = Depends(get_db)):
    """Retrieves full configuration, metrics summary, automated interpretation, and trial runs for an experiment."""
    exp = db.query(Experiment).filter(Experiment.id == experiment_id).first()
    if not exp:
        raise HTTPException(status_code=404, detail=f"Experiment '{experiment_id}' not found.")
    return _build_detail_response(exp)

@router.get("/experiments/{experiment_id}/timeseries")
def get_experiment_timeseries(experiment_id: str, db: Session = Depends(get_db)):
    """Fetches high-resolution time-series observations for an experiment."""
    exp = db.query(Experiment).filter(Experiment.id == experiment_id).first()
    if not exp:
        raise HTTPException(status_code=404, detail=f"Experiment '{experiment_id}' not found.")
    ts = db.query(TimeSeriesRecord).filter(TimeSeriesRecord.experiment_id == experiment_id).first()
    return {
        "experiment_id": experiment_id,
        "sample_count": len(ts.points_json) if ts and ts.points_json else 0,
        "points": ts.points_json if ts else []
    }

@router.post("/experiments/{experiment_id}/rerun", response_model=ExperimentDetailResponse)
def rerun_experiment(experiment_id: str, db: Session = Depends(get_db)):
    """Re-executes an experiment using its exact stored configuration and parameters."""
    exp = db.query(Experiment).filter(Experiment.id == experiment_id).first()
    if not exp:
        raise HTTPException(status_code=404, detail=f"Experiment '{experiment_id}' not found.")
        
    rerun_create = ExperimentCreate(
        title=f"Rerun of {exp.title}",
        scenario_id=exp.scenario_id,
        algorithms=exp.algorithms_json or ["reno", "newreno", "cubic", "bbr"],
        bandwidth_mbps=exp.bandwidth_mbps,
        base_rtt_ms=exp.base_rtt_ms,
        jitter_ms=exp.jitter_ms,
        packet_loss_rate=exp.packet_loss_rate,
        queue_limit_packets=exp.queue_limit_packets,
        duration_seconds=exp.duration_seconds,
        flow_count=exp.flow_count,
        background_traffic_ratio=exp.background_traffic_ratio,
        seed=exp.seed,
        repetitions=exp.repetitions,
    )
    new_exp = run_experiment_task(db, rerun_create)
    return _build_detail_response(new_exp)

@router.delete("/experiments/{experiment_id}")
def delete_experiment(experiment_id: str, db: Session = Depends(get_db)):
    """Deletes an experiment record along with associated runs and time series."""
    exp = db.query(Experiment).filter(Experiment.id == experiment_id).first()
    if not exp:
        raise HTTPException(status_code=404, detail=f"Experiment '{experiment_id}' not found.")
    db.delete(exp)
    db.commit()
    return {"message": f"Experiment '{experiment_id}' deleted successfully.", "deleted_id": experiment_id}

def _build_detail_response(exp: Experiment) -> ExperimentDetailResponse:
    run_responses = [
        AlgorithmRunResponse(
            id=r.id,
            algorithm_id=r.algorithm_id,
            flow_id=r.flow_id,
            trial_index=r.trial_index,
            throughput_mbps=r.throughput_mbps,
            goodput_mbps=r.goodput_mbps,
            avg_rtt_ms=r.avg_rtt_ms,
            p95_rtt_ms=r.p95_rtt_ms,
            queue_drops=r.queue_drops,
            random_drops=r.random_drops,
            total_drops=r.total_drops,
            retransmissions=r.retransmissions,
            loss_rate_pct=r.loss_rate_pct,
            utilization_pct=r.utilization_pct,
        )
        for r in exp.runs
    ]
    return ExperimentDetailResponse(
        id=exp.id,
        created_at=exp.created_at,
        title=exp.title,
        scenario_id=exp.scenario_id,
        scenario_name=exp.scenario_name,
        execution_mode=exp.execution_mode,
        simulator_name=exp.simulator_name,
        status=exp.status,
        error_message=exp.error_message,
        bandwidth_mbps=exp.bandwidth_mbps,
        base_rtt_ms=exp.base_rtt_ms,
        jitter_ms=exp.jitter_ms,
        packet_loss_rate=exp.packet_loss_rate,
        queue_limit_packets=exp.queue_limit_packets,
        duration_seconds=exp.duration_seconds,
        flow_count=exp.flow_count,
        background_traffic_ratio=exp.background_traffic_ratio,
        seed=exp.seed,
        repetitions=exp.repetitions,
        algorithms=exp.algorithms_json or [],
        metrics_summary=exp.metrics_summary_json or {},
        automated_interpretation=exp.automated_interpretation,
        runs=run_responses
    )
