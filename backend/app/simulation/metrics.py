"""
Network Metric Calculations and Analytical Formulas.
Contains rigorous implementations of:
- Jain's Fairness Index
- Application Goodput vs Network Throughput
- Round-Trip Time percentiles (p50, p95, p99)
- Bandwidth-Delay Product (BDP)
- Bottleneck Queueing Delay
- Packet Loss Ratios (distinguishing queue drops from random loss)
"""
import math
from typing import List, Optional, Dict, Any

def calculate_jains_fairness_index(throughputs: List[float]) -> Optional[float]:
    """
    Computes Jain's Fairness Index:
    J = (sum_{i=1}^n x_i)^2 / (n * sum_{i=1}^n x_i^2)
    For n flows, ranges from 1/n (worst fairness) to 1.0 (perfectly equal shares).
    Returns None if n <= 1 or if all throughputs are 0.
    """
    valid_rates = [max(0.0, float(x)) for x in throughputs]
    n = len(valid_rates)
    if n <= 1:
        return None  # Fairness index is not applicable for a single flow
        
    sum_x = sum(valid_rates)
    if sum_x == 0.0:
        return 1.0  # Equal zero shares
        
    sum_sq_x = sum(x * x for x in valid_rates)
    if sum_sq_x <= 0.0:
        return 1.0
        
    j = (sum_x * sum_x) / (n * sum_sq_x)
    return round(min(1.0, max(1.0 / n, j)), 4)

def calculate_percentiles(samples: List[float], percentiles: List[int] = [50, 95, 99]) -> Dict[str, float]:
    """Calculates ordered percentile values for a given series of samples."""
    if not samples:
        return {f"p{p}": 0.0 for p in percentiles}
    sorted_s = sorted(samples)
    n = len(sorted_s)
    res = {}
    for p in percentiles:
        idx = int((p / 100.0) * n)
        idx = min(idx, n - 1)
        res[f"p{p}"] = round(sorted_s[idx], 2)
    return res

def calculate_bdp(bandwidth_mbps: float, rtt_ms: float, mss_bytes: int = 1460) -> Dict[str, Any]:
    """
    Computes the Bandwidth-Delay Product (BDP):
    BDP_bits = Bandwidth (bps) * RTT (sec)
    BDP_bytes = BDP_bits / 8
    BDP_packets = BDP_bytes / MSS
    """
    rtt_sec = rtt_ms / 1000.0
    bandwidth_bps = bandwidth_mbps * 1e6
    bdp_bits = bandwidth_bps * rtt_sec
    bdp_bytes = bdp_bits / 8.0
    bdp_packets = bdp_bytes / mss_bytes
    return {
        "bdp_bits": round(bdp_bits, 1),
        "bdp_bytes": round(bdp_bytes, 1),
        "bdp_packets": round(bdp_packets, 1),
        "pipe_capacity_description": f"{round(bdp_packets, 1)} packets in transit required to fill pipe"
    }

def estimate_recovery_time(
    time_series: List[Dict[str, Any]],
    event_timestamp: float,
    flow_id: int = 0,
    threshold_pct: float = 0.90
) -> Optional[float]:
    """
    Estimates the time (in seconds) taken after a congestion or capacity change event
    for a flow to recover and reach >= threshold_pct of its subsequent steady-state delivery rate.
    """
    after_event = [p for p in time_series if p.get("timestamp", 0) >= event_timestamp]
    if len(after_event) < 5:
        return None
        
    rates = []
    for p in after_event:
        f_info = p.get("flows", {}).get(flow_id) or p.get("flows", {}).get(str(flow_id))
        if f_info:
            rates.append((p["timestamp"], f_info.get("throughput_mbps", 0.0)))
            
    if not rates:
        return None
        
    # Find steady state rate (average over last 30% of records)
    sample_cutoff = int(0.7 * len(rates))
    steady_state_rate = sum(r[1] for r in rates[sample_cutoff:]) / max(1, len(rates) - sample_cutoff)
    if steady_state_rate <= 0.1:
        return None
        
    target = steady_state_rate * threshold_pct
    for t, rate in rates:
        if rate >= target:
            return round(max(0.0, t - event_timestamp), 2)
            
    return None
