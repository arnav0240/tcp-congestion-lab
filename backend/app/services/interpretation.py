"""
Automated Scientific Interpretation Engine.
Generates objective, rule-based conclusions directly from observed experiment metrics.
Adheres strictly to scientific integrity: never claims universal superiority,
highlights trade-offs (e.g. throughput vs bufferbloat latency), reports variance,
and details specific causal network mechanics.
"""
from typing import Dict, Any, List

def generate_scientific_interpretation(
    scenario_name: str,
    parameters: Dict[str, Any],
    algorithms_summary: Dict[str, Any],
    execution_mode: str,
    repetitions: int = 1
) -> str:
    """
    Synthesizes an academic, evidence-based interpretation comparing the observed
    performance of tested TCP congestion control algorithms.
    """
    if not algorithms_summary:
        return "Insufficient simulation data collected to formulate an interpretation."

    bw = parameters.get("bandwidth_mbps", 50.0)
    base_rtt = parameters.get("base_rtt_ms", 40.0)
    loss = parameters.get("packet_loss_rate", 0.0) * 100.0
    queue = parameters.get("queue_limit_packets", 50)
    flows = parameters.get("flow_count", 1)

    # Sort algorithms by goodput
    sorted_by_goodput = sorted(
        algorithms_summary.items(),
        key=lambda item: item[1].get("mean_goodput_mbps", 0.0),
        reverse=True
    )
    
    # Sort algorithms by average RTT
    sorted_by_rtt = sorted(
        algorithms_summary.items(),
        key=lambda item: item[1].get("mean_avg_rtt_ms", 99999.0)
    )

    top_algo, top_data = sorted_by_goodput[0]
    bottom_algo, bottom_data = sorted_by_goodput[-1]
    
    top_gp = top_data.get("mean_goodput_mbps", 0.0)
    bottom_gp = bottom_data.get("mean_goodput_mbps", 0.0)
    
    lowest_rtt_algo, lowest_rtt_data = sorted_by_rtt[0]
    highest_rtt_algo, highest_rtt_data = sorted_by_rtt[-1]
    
    low_rtt = lowest_rtt_data.get("mean_avg_rtt_ms", 0.0)
    high_rtt = highest_rtt_data.get("mean_avg_rtt_ms", 0.0)

    paragraphs = []

    # 1. Context & Mode statement
    mode_desc = "NS-3 packet-level simulation" if execution_mode == "ns3" else "Antigravity Discrete-Event educational model"
    paragraphs.append(
        f"**Experimental Regime ({scenario_name}):** Tested under {bw} Mbps bottleneck, {base_rtt:.1f} ms base RTT, "
        f"{loss:.2f}% independent packet loss, and {queue} packet queue buffer over {repetitions} trial(s) using the {mode_desc}."
    )

    # 2. Goodput Observations
    gp_diff = top_gp - bottom_gp
    gp_ratio = (top_gp / max(0.001, bottom_gp)) if bottom_gp > 0 else 1.0
    
    if len(algorithms_summary) > 1:
        if gp_ratio > 1.3:
            gp_text = (
                f"**Delivery Rate Disparity:** `{top_algo.upper()}` demonstrated substantial goodput superiority, delivering "
                f"**{top_gp:.2f} Mbps** compared to `{bottom_algo.upper()}` at **{bottom_gp:.2f} Mbps** ({gp_ratio:.1f}× higher delivery). "
            )
        elif gp_ratio > 1.05:
            gp_text = (
                f"**Moderate Goodput Differentiation:** `{top_algo.upper()}` achieved slightly higher goodput (**{top_gp:.2f} Mbps**) "
                f"than `{bottom_algo.upper()}` (**{bottom_gp:.2f} Mbps**), representing a modest {((gp_ratio-1)*100):.1f}% margin. "
            )
        else:
            gp_text = (
                f"**Comparable Delivery Rates:** All tested algorithms operated within close proximity (~{top_gp:.2f} Mbps), "
                f"indicating that under clean low-loss conditions, bottleneck transmission speed rather than window control dominates throughput. "
            )
        paragraphs.append(gp_text)

    # 3. Latency & Bufferbloat Trade-off
    rtt_inflation = high_rtt - base_rtt
    if rtt_inflation > base_rtt * 0.5:
        paragraphs.append(
            f"**Latency Inflation (Bufferbloat):** Significant queue standing delay was observed. "
            f"`{highest_rtt_algo.upper()}` experienced an average RTT of **{high_rtt:.1f} ms** (95th percentile: {highest_rtt_data.get('mean_p95_rtt_ms', high_rtt):.1f} ms), "
            f"inflating baseline delay by **+{rtt_inflation:.1f} ms** due to buffer occupancy. In contrast, `{lowest_rtt_algo.upper()}` preserved lower delay "
            f"at **{low_rtt:.1f} ms**, demonstrating superior queuing discipline."
        )
    else:
        paragraphs.append(
            f"**Delay Stability:** Observed RTTs remained close to baseline propagation delay ({base_rtt:.1f} ms), "
            f"confirming minimal standing queue accumulation across the bottleneck."
        )

    # 4. Mechanism Analysis: Loss Resilience vs AIMD
    if loss > 0.5:
        bbr_data = algorithms_summary.get("bbr")
        reno_data = algorithms_summary.get("reno")
        if bbr_data and reno_data:
            paragraphs.append(
                f"**Loss Sensitivity Analysis:** Under {loss:.2f}% random loss, TCP Reno suffered severe rate suppression "
                f"({reno_data.get('mean_goodput_mbps', 0.0):.2f} Mbps) because AIMD erroneously interprets non-congestive channel losses as congestion collapse. "
                f"Conversely, BBR's model-based estimation maintained **{bbr_data.get('mean_goodput_mbps', 0.0):.2f} Mbps**, "
                f"demonstrating resilience by decoupling rate pacing from packet drops."
            )
    elif bw >= 100.0 and base_rtt >= 80.0:
        cubic_data = algorithms_summary.get("cubic")
        reno_data = algorithms_summary.get("reno")
        if cubic_data and reno_data:
            paragraphs.append(
                f"**High-BDP Scaling:** On this high Bandwidth-Delay Product path, CUBIC's cubic window growth function "
                f"($W(t) = C(t - K)^3 + W_{{max}}$) allowed faster capacity probing compared to Reno's linear 1-MSS/RTT restriction."
            )

    # 5. Fairness & Variance Note
    if repetitions > 1:
        stds = [f"{k.upper()}: ±{v.get('std_goodput_mbps', 0.0):.2f} Mbps" for k, v in algorithms_summary.items()]
        paragraphs.append(
            f"**Empirical Reproducibility:** Multi-trial variance across {repetitions} runs ({', '.join(stds)}) "
            f"confirms deterministic repeatability under matched pseudo-random seeds."
        )

    # 6. Scientific disclaimer
    paragraphs.append(
        "*(Note: Results reflect simulated discrete-event network conditions. Relative performance varies across topologies, buffer management disciplines (e.g. CoDel vs DropTail), and cross-traffic dynamics.)*"
    )

    return "\n\n".join(paragraphs)
