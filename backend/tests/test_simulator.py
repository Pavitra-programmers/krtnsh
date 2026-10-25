import pytest
from app.services.analytics import AnalyticsEngine

def test_simulator_strategies():
    engine = AnalyticsEngine()
    # Test for 2026-01-15
    res_p50 = engine.simulate_procurement(target_date="2026-01-15", strategy="p50", demand_peak_mw=38000.0)
    assert "summary" in res_p50
    assert "schedule" in res_p50
    assert len(res_p50["schedule"]) == 48

    summary = res_p50["summary"]
    assert summary["total_demand_mwh"] > 0
    assert summary["total_thermal_procured_mwh"] > 0
    assert summary["total_wind_procured_mwh"] > 0

    # Under P90 (downside protection), utility hedges more conservatively,
    # expecting lower wind, so thermal procured must be HIGHER than under P50:
    res_p90 = engine.simulate_procurement(target_date="2026-01-15", strategy="p90", demand_peak_mw=38000.0)
    assert res_p90["summary"]["total_thermal_procured_mwh"] >= summary["total_thermal_procured_mwh"]
    # And short imbalance exposure under P90 should be strictly LOWER or equal:
    assert res_p90["summary"]["short_imbalance_mwh"] <= summary["short_imbalance_mwh"]

def test_simulator_balance_equality():
    engine = AnalyticsEngine()
    res = engine.simulate_procurement(target_date="2026-01-15", strategy="p50", demand_peak_mw=38000.0)
    for period in res["schedule"]:
        demand = period["demand_mw"]
        thermal = period["thermal_procured_mw"]
        procured_wind = period["procured_wind_mw"]
        # Demand should equal thermal + procured_wind
        assert round(thermal + procured_wind, 1) == round(demand, 1)
