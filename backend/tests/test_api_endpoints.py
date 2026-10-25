import pytest
from fastapi.testclient import TestClient
from app.main import app

@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c

def test_health_endpoint(client):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "inventory" in data
    assert data["inventory"]["fuelhh_wind_records"] > 0

def test_overview_endpoint(client):
    response = client.get("/api/overview?start_date=2026-01-01&end_date=2026-01-07&cutoff_time=11:00:00")
    assert response.status_code == 200
    data = response.json()
    assert "metrics" in data
    assert "timeseries" in data
    assert "daily_breakdown" in data
    assert data["metrics"]["count"] > 0
    assert data["metrics"]["mae"] > 0

def test_forecasts_endpoint(client):
    response = client.get("/api/forecasts?date=2026-01-15&cutoff_time=11:00:00")
    assert response.status_code == 200
    data = response.json()
    assert data["date"] == "2026-01-15"
    assert len(data["periods"]) == 48

def test_accuracy_endpoint(client):
    response = client.get("/api/accuracy?start_date=2026-01-01&end_date=2026-01-10&cutoff_time=11:00:00")
    assert response.status_code == 200
    data = response.json()
    assert "metrics" in data
    assert "diurnal_profile" in data
    assert "error_distribution" in data
    assert "scatter_sample" in data
    assert "lead_time_decay" in data
    assert len(data["diurnal_profile"]) == 48

def test_simulator_endpoint(client):
    response = client.get("/api/simulator?date=2026-01-15&cutoff_time=11:00:00&strategy=p50")
    assert response.status_code == 200
    data = response.json()
    assert "summary" in data
    assert "schedule" in data

def test_vintages_endpoint(client):
    response = client.get("/api/vintages/evolution?date=2026-01-15&hour=12:00:00")
    assert response.status_code == 200
    data = response.json()
    assert "revisions" in data
    assert data["vintages_count"] > 0

def test_data_quality_endpoint(client):
    response = client.get("/api/data-quality?start_date=2026-01-01&end_date=2026-01-31")
    assert response.status_code == 200
    data = response.json()
    assert "fuelhh_audit" in data
    assert "windfor_audit" in data
    assert data["dataset_scope"]["coverage_percentage"] == 100.0
