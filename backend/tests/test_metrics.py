"""
Tests for mathematical formulas: Jain's Fairness, percentiles, BDP.
"""
from app.simulation.metrics import calculate_jains_fairness_index, calculate_percentiles, calculate_bdp

def test_jains_fairness_index_equal_flows():
    # When 4 flows have identical throughput, J must be exactly 1.0
    j = calculate_jains_fairness_index([25.0, 25.0, 25.0, 25.0])
    assert j == 1.0

def test_jains_fairness_index_worst_case():
    # If 1 flow gets all throughput and 3 get 0, J = 1/4 = 0.25
    j = calculate_jains_fairness_index([100.0, 0.0, 0.0, 0.0])
    assert j == 0.25

def test_jains_fairness_single_flow_returns_none():
    assert calculate_jains_fairness_index([50.0]) is None

def test_jains_fairness_zero_rates():
    assert calculate_jains_fairness_index([0.0, 0.0]) == 1.0

def test_percentiles_calculation():
    samples = list(range(1, 101))  # 1 to 100
    p = calculate_percentiles(samples, [50, 95])
    assert p["p50"] >= 50.0
    assert p["p95"] >= 95.0

def test_bdp_calculation():
    # 100 Mbps, 40 ms RTT -> BDP = 4,000,000 bits = 500,000 bytes = ~342.5 packets
    res = calculate_bdp(bandwidth_mbps=100.0, rtt_ms=40.0, mss_bytes=1460)
    assert res["bdp_bits"] == 4000000.0
    assert res["bdp_bytes"] == 500000.0
    assert round(res["bdp_packets"], 1) == 342.5
