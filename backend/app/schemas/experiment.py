"""
Pydantic v2 schemas for request validation and API responses.
Includes bounds checking for network parameters as specified in scientific simulation requirements.
"""
from pydantic import BaseModel, Field, field_validator
from typing import List, Dict, Any, Optional
from datetime import datetime

class BandwidthChangePoint(BaseModel):
    time: float = Field(..., ge=0.1, le=120.0, description="Timestamp in seconds when bandwidth shifts")
    bandwidth_mbps: float = Field(..., ge=1.0, le=1000.0, description="New bandwidth in Mbps")

class ExperimentCreate(BaseModel):
    title: Optional[str] = Field("TCP Congestion Control Experiment", max_length=150)
    scenario_id: Optional[str] = Field("custom", description="Preset scenario identifier or 'custom'")
    algorithms: List[str] = Field(
        default=["reno", "newreno", "cubic", "bbr"],
        min_length=1,
        max_length=4,
        description="List of algorithms to simulate and compare under identical conditions"
    )
    bandwidth_mbps: float = Field(50.0, ge=1.0, le=1000.0, description="Bottleneck link bandwidth (1-1000 Mbps)")
    base_rtt_ms: float = Field(40.0, ge=1.0, le=500.0, description="Base round-trip propagation time (1-500 ms)")
    jitter_ms: float = Field(0.0, ge=0.0, le=100.0, description="Delay variation jitter (0-100 ms)")
    packet_loss_rate: float = Field(0.0, ge=0.0, le=0.10, description="Random non-congestive packet loss rate (0 - 10%)")
    queue_limit_packets: int = Field(50, ge=10, le=2000, description="Router buffer capacity in packets (10-2000)")
    duration_seconds: float = Field(8.0, ge=1.0, le=120.0, description="Simulation duration in seconds (1-120 s)")
    flow_count: int = Field(1, ge=1, le=8, description="Number of concurrent TCP flows per algorithm (1-8)")
    background_traffic_ratio: float = Field(0.0, ge=0.0, le=0.80, description="Cross-traffic intensity consuming bottleneck (0-80%)")
    seed: int = Field(42, description="Random seed for deterministic reproducibility")
    repetitions: int = Field(1, ge=1, le=10, description="Number of repeated runs with matched seeds for variance analysis (1-10)")
    bandwidth_schedule: Optional[List[BandwidthChangePoint]] = Field(default=None, description="Optional dynamic capacity changes")

    @field_validator("algorithms")
    @classmethod
    def validate_algorithms(cls, v: List[str]) -> List[str]:
        valid = {"reno", "newreno", "cubic", "bbr"}
        cleaned = [a.strip().lower() for a in v]
        for a in cleaned:
            if a not in valid:
                raise ValueError(f"Invalid algorithm '{a}'. Permitted: {sorted(list(valid))}")
        return cleaned

class AlgorithmRunResponse(BaseModel):
    id: str
    algorithm_id: str
    flow_id: int
    trial_index: int
    throughput_mbps: float
    goodput_mbps: float
    avg_rtt_ms: float
    p95_rtt_ms: float
    queue_drops: int
    random_drops: int
    total_drops: int
    retransmissions: int
    loss_rate_pct: float
    utilization_pct: float

    model_config = {"from_attributes": True}

class ExperimentSummary(BaseModel):
    id: str
    created_at: datetime
    title: str
    scenario_id: str
    scenario_name: str
    execution_mode: str
    status: str
    bandwidth_mbps: float
    base_rtt_ms: float
    packet_loss_rate: float
    queue_limit_packets: int
    duration_seconds: float
    repetitions: int
    algorithms: List[str]
    total_throughput_mbps: Optional[float] = None
    jain_fairness_index: Optional[float] = None

class ExperimentDetailResponse(BaseModel):
    id: str
    created_at: datetime
    title: str
    scenario_id: str
    scenario_name: str
    execution_mode: str
    simulator_name: str
    status: str
    error_message: Optional[str] = None
    
    # Parameters
    bandwidth_mbps: float
    base_rtt_ms: float
    jitter_ms: float
    packet_loss_rate: float
    queue_limit_packets: int
    duration_seconds: float
    flow_count: int
    background_traffic_ratio: float
    seed: int
    repetitions: int
    
    # Algorithms and Metrics
    algorithms: List[str]
    metrics_summary: Dict[str, Any]
    automated_interpretation: Optional[str] = None
    runs: List[AlgorithmRunResponse] = []

class CompareRequest(BaseModel):
    experiment_ids: List[str] = Field(..., min_length=1, max_length=10)
    metric: str = Field("goodput_mbps", description="Metric to rank and compare")

class TimeSeriesPointResponse(BaseModel):
    timestamp: float
    router_queue_packets: int
    router_queue_pct: float
    bottleneck_bandwidth_mbps: float
    total_throughput_mbps: float
    utilization_pct: float
    flows: Dict[str, Any]
