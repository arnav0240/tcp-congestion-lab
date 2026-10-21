"""
SQLAlchemy ORM models for TCP Experiment persistence.
Stores experiments, individual algorithm runs, aggregate metric summaries, and time-series telemetry.
"""
import datetime
import uuid
from sqlalchemy import Column, String, Float, Integer, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.database.session import Base

def generate_uuid():
    return str(uuid.uuid4())

def utc_now():
    return datetime.datetime.now(datetime.timezone.utc)

class Experiment(Base):
    __tablename__ = "experiments"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    created_at = Column(DateTime, default=utc_now, index=True)
    title = Column(String(200), default="TCP Congestion Control Experiment")
    scenario_id = Column(String(50), default="custom", index=True)
    scenario_name = Column(String(100), default="Custom Scenario")
    execution_mode = Column(String(50), default="educational_sim")  # 'educational_sim' or 'ns3'
    simulator_name = Column(String(100), default="Antigravity Discrete-Event Simulator")
    
    # Network parameters
    bandwidth_mbps = Column(Float, nullable=False)
    base_rtt_ms = Column(Float, nullable=False)
    jitter_ms = Column(Float, default=0.0)
    packet_loss_rate = Column(Float, default=0.0)
    queue_limit_packets = Column(Integer, default=50)
    duration_seconds = Column(Float, default=20.0)
    flow_count = Column(Integer, default=1)
    background_traffic_ratio = Column(Float, default=0.0)
    seed = Column(Integer, default=42)
    repetitions = Column(Integer, default=1)
    
    # Execution status
    status = Column(String(20), default="PENDING", index=True)  # PENDING, RUNNING, COMPLETED, FAILED
    error_message = Column(Text, nullable=True)
    
    # Algorithms tested
    algorithms_json = Column(JSON, default=list)  # e.g. ["reno", "newreno", "cubic", "bbr"]
    
    # Aggregated metrics and automated interpretation
    metrics_summary_json = Column(JSON, default=dict)
    automated_interpretation = Column(Text, nullable=True)
    
    # Relationships
    runs = relationship("AlgorithmRun", back_populates="experiment", cascade="all, delete-orphan")
    time_series_record = relationship("TimeSeriesRecord", back_populates="experiment", uselist=False, cascade="all, delete-orphan")

class AlgorithmRun(Base):
    __tablename__ = "algorithm_runs"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    experiment_id = Column(String(36), ForeignKey("experiments.id", ondelete="CASCADE"), index=True)
    algorithm_id = Column(String(50), nullable=False, index=True)
    flow_id = Column(Integer, default=0)
    trial_index = Column(Integer, default=0)
    
    throughput_mbps = Column(Float, nullable=False)
    goodput_mbps = Column(Float, nullable=False)
    avg_rtt_ms = Column(Float, nullable=False)
    p95_rtt_ms = Column(Float, nullable=False)
    queue_drops = Column(Integer, default=0)
    random_drops = Column(Integer, default=0)
    total_drops = Column(Integer, default=0)
    retransmissions = Column(Integer, default=0)
    loss_rate_pct = Column(Float, default=0.0)
    utilization_pct = Column(Float, default=0.0)
    
    experiment = relationship("Experiment", back_populates="runs")

class TimeSeriesRecord(Base):
    __tablename__ = "time_series_records"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    experiment_id = Column(String(36), ForeignKey("experiments.id", ondelete="CASCADE"), unique=True, index=True)
    points_json = Column(JSON, default=list)  # List of epoch telemetry dictionaries
    
    experiment = relationship("Experiment", back_populates="time_series_record")
