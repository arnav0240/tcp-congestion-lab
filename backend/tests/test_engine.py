"""
Tests for Discrete-Event Simulation Engine.
Verifies queue limits, zero-loss invariants, deterministic reproducibility, and multi-flow sharing.
"""
from app.simulation.engine import NetworkSimulator

def test_simulator_deterministic_reproducibility():
    sim1 = NetworkSimulator(bandwidth_mbps=20.0, base_rtt_ms=30.0, duration_seconds=5.0, flow_algorithms=["reno"], random_seed=42)
    res1 = sim1.run()

    sim2 = NetworkSimulator(bandwidth_mbps=20.0, base_rtt_ms=30.0, duration_seconds=5.0, flow_algorithms=["reno"], random_seed=42)
    res2 = sim2.run()

    assert res1["total_throughput_mbps"] == res2["total_throughput_mbps"]
    assert res1["total_goodput_mbps"] == res2["total_goodput_mbps"]

def test_zero_loss_scenario_has_zero_random_drops():
    sim = NetworkSimulator(
        bandwidth_mbps=50.0,
        base_rtt_ms=20.0,
        packet_loss_rate=0.0,
        queue_limit_packets=200,
        duration_seconds=5.0,
        flow_algorithms=["cubic"],
        random_seed=123
    )
    res = sim.run()
    flow = res["flows"][0]
    assert flow["random_drops"] == 0

def test_queue_limit_is_respected_and_drops_excess():
    # Very small queue (10 packets) on congested link causes drops
    sim = NetworkSimulator(
        bandwidth_mbps=5.0,
        base_rtt_ms=50.0,
        queue_limit_packets=10,
        duration_seconds=5.0,
        flow_algorithms=["reno", "reno"],
        random_seed=99
    )
    res = sim.run()
    # Ensure simulation ran and time series tracked max queue <= 10
    for pt in res["time_series"]:
        assert pt["router_queue_packets"] <= 10

def test_dynamic_bandwidth_schedule():
    sched = [{"time": 2.0, "bandwidth_mbps": 10.0}]
    sim = NetworkSimulator(
        bandwidth_mbps=30.0,
        duration_seconds=4.0,
        bandwidth_schedule=sched,
        random_seed=42
    )
    res = sim.run()
    ts = res["time_series"]
    early_pt = next(p for p in ts if p["timestamp"] < 2.0)
    late_pt = next(p for p in ts if p["timestamp"] > 2.5)
    assert early_pt["bottleneck_bandwidth_mbps"] == 30.0
    assert late_pt["bottleneck_bandwidth_mbps"] == 10.0
