from typing import Dict, Type
from app.simulation.base import CongestionControlAlgorithm
from app.simulation.reno import TCPReno
from app.simulation.newreno import TCPNewReno
from app.simulation.cubic import TCPCubic
from app.simulation.bbr import TCPBbr

ALGORITHM_REGISTRY: Dict[str, Type[CongestionControlAlgorithm]] = {
    "reno": TCPReno,
    "newreno": TCPNewReno,
    "cubic": TCPCubic,
    "bbr": TCPBbr,
}

ALGORITHM_METADATA = {
    "reno": {
        "id": "reno",
        "name": "TCP Reno",
        "standard": "RFC 5681",
        "family": "Loss-Based (AIMD)",
        "window_growth": "Additive Increase (+1 MSS / RTT)",
        "congestion_signal": "Packet loss (3 DupACKs / RTO)",
        "loss_reduction": "Halves cwnd (ssthresh = cwnd / 2)",
        "best_for": "Low-delay, stable wired LANs",
        "weakness": "Severe throughput degradation on high-BDP or random-loss networks (bufferbloat / loss sensitivity)",
        "color": "#38bdf8", # sky-400
    },
    "newreno": {
        "id": "newreno",
        "name": "TCP NewReno",
        "standard": "RFC 6582",
        "family": "Loss-Based (AIMD + Partial ACKs)",
        "window_growth": "Additive Increase (+1 MSS / RTT)",
        "congestion_signal": "Packet loss (3 DupACKs / RTO)",
        "loss_reduction": "Fast Recovery handles multiple drops per window without RTO",
        "best_for": "Networks with occasional burst packet loss",
        "weakness": "Still RTT-dependent and cuts rate drastically on random wireless losses",
        "color": "#a855f7", # purple-500
    },
    "cubic": {
        "id": "cubic",
        "name": "TCP CUBIC",
        "standard": "RFC 9438 / RFC 8312",
        "family": "Loss-Based (Cubic Function of Real Time)",
        "window_growth": "W(t) = C(t - K)^3 + W_max (time-based)",
        "congestion_signal": "Packet loss (3 DupACKs / RTO)",
        "loss_reduction": "Beta decrease (0.7x cwnd)",
        "best_for": "High-Bandwidth Long-Distance (LFN) networks, default Linux TCP",
        "weakness": "Can fill deep queues causing bufferbloat if not paired with AQM (e.g., CoDel)",
        "color": "#06b6d4", # cyan-500
    },
    "bbr": {
        "id": "bbr",
        "name": "TCP BBR",
        "standard": "Cardwell et al. (IETF Draft / ACM Queue)",
        "family": "Model-Based (Rate-Paced)",
        "window_growth": "Paced according to BtlBw × pacing_gain",
        "congestion_signal": "Max Bandwidth filter & Min RTT (Queue buildup)",
        "loss_reduction": "Maintains 1 BDP flight size; does not slash cwnd on random loss",
        "best_for": "Lossy wireless networks, shallow buffers, bufferbloat mitigation",
        "weakness": "Can overpower loss-based flows in deep shared drop-tail buffers without pacing",
        "color": "#10b981", # emerald-500
    },
}

def create_algorithm(algorithm_id: str, mss: int = 1460, initial_cwnd: float = 10.0) -> CongestionControlAlgorithm:
    norm_id = algorithm_id.strip().lower()
    if norm_id not in ALGORITHM_REGISTRY:
        raise ValueError(f"Unknown algorithm: '{algorithm_id}'. Available: {list(ALGORITHM_REGISTRY.keys())}")
    return ALGORITHM_REGISTRY[norm_id](mss_bytes=mss, initial_cwnd=initial_cwnd)
