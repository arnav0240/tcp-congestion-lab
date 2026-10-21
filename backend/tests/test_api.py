"""
API integration tests for all endpoints: health, algorithms, scenarios, experiments CRUD, compare, and export.
"""
def test_health_endpoint(client):
    res = client.get("/api/v1/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert data["database_connected"] is True
    assert "engine" in data

def test_algorithms_catalog(client):
    res = client.get("/api/v1/algorithms")
    assert res.status_code == 200
    data = res.json()
    assert data["count"] == 4
    algo_ids = [a["id"] for a in data["algorithms"]]
    assert "reno" in algo_ids
    assert "newreno" in algo_ids
    assert "cubic" in algo_ids
    assert "bbr" in algo_ids

def test_scenarios_catalog(client):
    res = client.get("/api/v1/scenarios")
    assert res.status_code == 200
    data = res.json()
    assert data["count"] >= 6

def test_create_and_query_experiment(client):
    payload = {
        "title": "Automated Test Experiment",
        "scenario_id": "low_latency_lan",
        "algorithms": ["reno", "cubic"],
        "bandwidth_mbps": 50.0,
        "base_rtt_ms": 10.0,
        "jitter_ms": 0.0,
        "packet_loss_rate": 0.0,
        "queue_limit_packets": 50,
        "duration_seconds": 6.0,
        "flow_count": 1,
        "seed": 42,
        "repetitions": 1
    }
    create_res = client.post("/api/v1/experiments", json=payload)
    assert create_res.status_code == 201
    exp = create_res.json()
    exp_id = exp["id"]
    assert exp["status"] == "COMPLETED"
    assert "reno" in exp["metrics_summary"]
    assert "cubic" in exp["metrics_summary"]
    assert exp["automated_interpretation"] is not None

    # List experiments
    list_res = client.get("/api/v1/experiments")
    assert list_res.status_code == 200
    assert any(e["id"] == exp_id for e in list_res.json())

    # Get details
    detail_res = client.get(f"/api/v1/experiments/{exp_id}")
    assert detail_res.status_code == 200
    assert detail_res.json()["id"] == exp_id

    # Get timeseries
    ts_res = client.get(f"/api/v1/experiments/{exp_id}/timeseries")
    assert ts_res.status_code == 200
    assert ts_res.json()["sample_count"] > 0

    # Compare
    comp_res = client.post("/api/v1/compare", json={"experiment_ids": [exp_id], "metric": "goodput_mbps"})
    assert comp_res.status_code == 200
    assert len(comp_res.json()["results"]) >= 2

    # Exports
    for fmt in ["json", "csv_metrics", "csv_timeseries", "markdown"]:
        exp_res = client.get(f"/api/v1/experiments/{exp_id}/export?format={fmt}")
        assert exp_res.status_code == 200
        assert len(exp_res.content) > 10

    # Delete
    del_res = client.delete(f"/api/v1/experiments/{exp_id}")
    assert del_res.status_code == 200

    # Query again should return 404
    get_again = client.get(f"/api/v1/experiments/{exp_id}")
    assert get_again.status_code == 404

def test_invalid_parameters_rejected(client):
    # Invalid bandwidth (exceeds 1000 Mbps)
    bad_bw = {
        "bandwidth_mbps": 5000.0,
        "base_rtt_ms": 20.0,
        "algorithms": ["reno"]
    }
    res = client.post("/api/v1/experiments", json=bad_bw)
    assert res.status_code == 422

    # Invalid algorithm name
    bad_algo = {
        "bandwidth_mbps": 50.0,
        "base_rtt_ms": 20.0,
        "algorithms": ["unknown_algo"]
    }
    res = client.post("/api/v1/experiments", json=bad_algo)
    assert res.status_code == 422
