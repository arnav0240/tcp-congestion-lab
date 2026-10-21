"""
Base interface and dataclasses for TCP Congestion Control Algorithms.
Provides a unified abstraction for loss-based and model-based congestion control.
"""
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from enum import Enum
from typing import Dict, Any, Optional

class CongestionState(str, Enum):
    SLOW_START = "SLOW_START"
    CONGESTION_AVOIDANCE = "CONGESTION_AVOIDANCE"
    FAST_RECOVERY = "FAST_RECOVERY"
    DRAIN = "DRAIN"
    PROBE_BW = "PROBE_BW"
    PROBE_RTT = "PROBE_RTT"
    STARTUP = "STARTUP"

@dataclass
class TCPMetricsSnapshot:
    algorithm: str
    cwnd_packets: float
    ssthresh_packets: float
    pacing_rate_mbps: float
    state: str
    in_flight_packets: int
    rtt_sec: float
    min_rtt_sec: float
    extra: Dict[str, Any] = field(default_factory=dict)

class CongestionControlAlgorithm(ABC):
    """
    Abstract Base Class for TCP Congestion Control algorithms.
    Each algorithm manages its own congestion window (cwnd), slow-start threshold (ssthresh),
    and pacing rate.
    """
    def __init__(self, mss_bytes: int = 1460, initial_cwnd: float = 10.0):
        self.mss = mss_bytes
        self.initial_cwnd = initial_cwnd
        self.cwnd: float = initial_cwnd  # in segments (MSS)
        self.ssthresh: float = 64.0      # in segments (MSS)
        self.state: CongestionState = CongestionState.SLOW_START
        self.rtt: float = 0.05           # current smoothed RTT in seconds
        self.min_rtt: float = 0.05       # minimum observed RTT in seconds
        self.pacing_rate_bps: float = 0.0

    @abstractmethod
    def on_ack(self, ack_num: int, bytes_acked: int, rtt_sample: float, now: float, is_duplicate: bool = False, is_partial: bool = False) -> None:
        """Called whenever an ACK is received."""
        pass

    @abstractmethod
    def on_loss(self, loss_type: str, now: float) -> None:
        """
        Called when packet loss is detected.
        loss_type can be 'dup_ack' (3 dup ACKs) or 'timeout'.
        """
        pass

    def get_cwnd(self) -> float:
        """Returns the current cwnd in packets (MSS units)."""
        return max(1.0, self.cwnd)

    def get_pacing_rate(self) -> float:
        """Returns pacing rate in bps (bits per second). 0.0 means unpaced window-limited."""
        return self.pacing_rate_bps

    def get_snapshot(self, in_flight: int = 0) -> TCPMetricsSnapshot:
        pacing_mbps = (self.pacing_rate_bps / 1e6) if self.pacing_rate_bps > 0 else 0.0
        return TCPMetricsSnapshot(
            algorithm=self.__class__.__name__,
            cwnd_packets=round(self.cwnd, 2),
            ssthresh_packets=round(self.ssthresh, 2),
            pacing_rate_mbps=round(pacing_mbps, 3),
            state=self.state.value,
            in_flight_packets=in_flight,
            rtt_sec=round(self.rtt, 4),
            min_rtt_sec=round(self.min_rtt, 4),
            extra={}
        )

    def reset(self):
        self.cwnd = self.initial_cwnd
        self.ssthresh = 64.0
        self.state = CongestionState.SLOW_START
        self.pacing_rate_bps = 0.0
