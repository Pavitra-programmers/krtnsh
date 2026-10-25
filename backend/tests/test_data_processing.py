import pytest
from app.services.analytics import AnalyticsEngine
from app.db import get_counts

def test_sqlite_counts():
    counts = get_counts()
    assert counts["fuelhh_wind_records"] > 1500
    assert counts["windfor_forecast_records"] > 10000

def test_hourly_resolution_alignment():
    engine = AnalyticsEngine()
    df_hourly = engine.get_aligned_data(
        start_date="2026-01-01",
        end_date="2026-01-07",
        cutoff_time="11:00:00",
        resolution="hourly"
    )
    # 7 days * 24 hours = 168 rows
    assert len(df_hourly) == 168
    assert "actual_mw" in df_hourly
    assert "forecast_mw" in df_hourly

def test_settlement_period_coverage_january():
    engine = AnalyticsEngine()
    df_sp = engine.get_aligned_data(
        start_date="2026-01-01",
        end_date="2026-01-31",
        cutoff_time="11:00:00",
        resolution="settlement_period"
    )
    # 31 days * 48 SPs = 1488 rows
    assert len(df_sp) == 1488
    # Zero nulls
    assert df_sp["actual_mw"].isna().sum() == 0
    assert df_sp["forecast_mw"].isna().sum() == 0

def test_lead_time_decay_monotonicity():
    engine = AnalyticsEngine()
    decay = engine.get_lead_time_decay(start_date="2026-01-01", end_date="2026-01-31")
    assert len(decay) > 0
    # Buckets exist
    buckets = [d["bucket"] for d in decay]
    assert "0-6h" in buckets
    assert "12-24h" in buckets
