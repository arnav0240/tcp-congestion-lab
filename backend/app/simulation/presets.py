"""
Built-in Scenario Presets for TCP Research Experiments.
Each scenario models a specific network regime with defined educational questions.
"""
from typing import Dict, Any, List

SCENARIO_PRESETS: Dict[str, Dict[str, Any]] = {
    "low_latency_lan": {
        "id": "low_latency_lan",
        "name": "Low-Latency LAN",
        "description": "High bandwidth, ultra-low propagation delay, and zero channel loss. Baseline comparison for clean wired local area networks.",
        "bandwidth_mbps": 100.0,
        "base_rtt_ms": 5.0,
        "jitter_ms": 0.5,
        "packet_loss_rate": 0.0,
        "queue_limit_packets": 60,
        "duration_seconds": 8.0,
        "flow_count": 1,
        "background_traffic_ratio": 0.0,
        "bandwidth_schedule": [],
        "research_question": "Do loss-based algorithms like Reno and CUBIC keep pace with BBR when delay is negligible and drops are rare?"
    },
    "high_bdp_lfn": {
        "id": "high_bdp_lfn",
        "name": "High-Bandwidth, Long-Distance (LFN)",
        "description": "High bandwidth and high round-trip time (e.g. transcontinental optical link). Examines Bandwidth-Delay Product (BDP) scalability.",
        "bandwidth_mbps": 100.0,
        "base_rtt_ms": 120.0,
        "jitter_ms": 2.0,
        "packet_loss_rate": 0.001,
        "queue_limit_packets": 300,
        "duration_seconds": 8.0,
        "flow_count": 1,
        "background_traffic_ratio": 0.0,
        "bandwidth_schedule": [],
        "research_question": "Why does Reno take dozens of seconds to recover after a loss event on high-BDP pipes, while CUBIC and BBR scale efficiently?"
    },
    "lossy_wireless": {
        "id": "lossy_wireless",
        "name": "Lossy Wireless Network",
        "description": "Moderate bandwidth with 2.5% non-congestive random packet loss and variable delay jitter, typical of Wi-Fi or cellular links.",
        "bandwidth_mbps": 25.0,
        "base_rtt_ms": 45.0,
        "jitter_ms": 12.0,
        "packet_loss_rate": 0.025, # 2.5% random drop
        "queue_limit_packets": 50,
        "duration_seconds": 8.0,
        "flow_count": 1,
        "background_traffic_ratio": 0.05,
        "bandwidth_schedule": [],
        "research_question": "How does BBR's model-based design sustain high goodput despite random loss, whereas Reno and CUBIC collapse their windows?"
    },
    "congested_bottleneck": {
        "id": "congested_bottleneck",
        "name": "Congested Bottleneck",
        "description": "Constrained bandwidth bottleneck link shared by multiple simultaneous competing flows with small queue buffer.",
        "bandwidth_mbps": 12.0,
        "base_rtt_ms": 40.0,
        "jitter_ms": 1.0,
        "packet_loss_rate": 0.0,
        "queue_limit_packets": 25,
        "duration_seconds": 8.0,
        "flow_count": 4,
        "background_traffic_ratio": 0.20,
        "bandwidth_schedule": [],
        "research_question": "How fairly do multiple competing flows share a narrow bottleneck, and what is the resulting Jain's Fairness Index?"
    },
    "bufferbloat_study": {
        "id": "bufferbloat_study",
        "name": "Bufferbloat Study",
        "description": "Oversized bottleneck buffer (500 packets) with sustained transmission. Analyzes the trade-off between throughput and latency inflation.",
        "bandwidth_mbps": 20.0,
        "base_rtt_ms": 30.0,
        "jitter_ms": 1.0,
        "packet_loss_rate": 0.0,
        "queue_limit_packets": 500,
        "duration_seconds": 10.0,
        "flow_count": 1,
        "background_traffic_ratio": 0.0,
        "bandwidth_schedule": [],
        "research_question": "How severely do loss-based algorithms bloat standing queues, and how effectively does BBR prevent latency collapse?"
    },
    "dynamic_bandwidth": {
        "id": "dynamic_bandwidth",
        "name": "Dynamic Bandwidth Fluctuation",
        "description": "Bottleneck link capacity changes dynamically over time (drops from 50 Mbps down to 15 Mbps at 3.5s, then jumps to 60 Mbps at 7.0s).",
        "bandwidth_mbps": 50.0,
        "base_rtt_ms": 35.0,
        "jitter_ms": 2.0,
        "packet_loss_rate": 0.0,
        "queue_limit_packets": 60,
        "duration_seconds": 10.0,
        "flow_count": 1,
        "background_traffic_ratio": 0.0,
        "bandwidth_schedule": [
            {"time": 3.5, "bandwidth_mbps": 15.0},
            {"time": 7.0, "bandwidth_mbps": 60.0}
        ],
        "research_question": "Which algorithm converges fastest when path capacity drops and subsequently expands?"
    },
    "custom": {
        "id": "custom",
        "name": "Custom Configuration",
        "description": "User-defined experimental parameters for exploratory academic networking research.",
        "bandwidth_mbps": 50.0,
        "base_rtt_ms": 40.0,
        "jitter_ms": 2.0,
        "packet_loss_rate": 0.0,
        "queue_limit_packets": 50,
        "duration_seconds": 8.0,
        "flow_count": 1,
        "background_traffic_ratio": 0.0,
        "bandwidth_schedule": [],
        "research_question": "Custom parametric exploration."
    }
}

def get_scenario(scenario_id: str) -> Dict[str, Any]:
    return SCENARIO_PRESETS.get(scenario_id, SCENARIO_PRESETS["custom"]).copy()

def list_scenarios() -> List[Dict[str, Any]]:
    return list(SCENARIO_PRESETS.values())
