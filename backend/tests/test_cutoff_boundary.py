import pytest
import sqlite3
import pandas as pd
from app.services.analytics import AnalyticsEngine
from app.db import init_db, save_fuelhh_batch, save_windfor_batch

@pytest.fixture
def mock_db(tmp_path):
    test_db_path = str(tmp_path / "test_wind.db")
    init_db(test_db_path)

    # Insert delivery day FUELHH for 2026-01-10
    actuals = [
        {
            "publishTime": "2026-01-10T00:30:00Z",
            "startTime": "2026-01-10T00:00:00Z",
            "settlementDate": "2026-01-10",
            "settlementPeriod": 1,
            "fuelType": "WIND",
            "generation": 5000.0
        },
        {
            "publishTime": "2026-01-10T01:00:00Z",
            "startTime": "2026-01-10T00:30:00Z",
            "settlementDate": "2026-01-10",
            "settlementPeriod": 2,
            "fuelType": "WIND",
            "generation": 5200.0
        }
    ]
    save_fuelhh_batch(actuals, test_db_path)

    # Insert 3 forecast revisions for 2026-01-10 00:00:00Z
    # 1. 2026-01-09 08:00:00Z -> Gen = 4000 (Early Day-Ahead)
    # 2. 2026-01-09 10:30:00Z -> Gen = 4500 (Just before 11:00 cutoff)
    # 3. 2026-01-09 14:00:00Z -> Gen = 6000 (After 11:00 cutoff, before 15:30)
    # 4. 2026-01-09 23:30:00Z -> Gen = 7000 (Late intraday)
    forecasts = [
        {"publishTime": "2026-01-09T08:00:00Z", "startTime": "2026-01-10T00:00:00Z", "generation": 4000.0},
        {"publishTime": "2026-01-09T10:30:00Z", "startTime": "2026-01-10T00:00:00Z", "generation": 4500.0},
        {"publishTime": "2026-01-09T14:00:00Z", "startTime": "2026-01-10T00:00:00Z", "generation": 6000.0},
        {"publishTime": "2026-01-09T23:30:00Z", "startTime": "2026-01-10T00:00:00Z", "generation": 7000.0},
    ]
    save_windfor_batch(forecasts, test_db_path)

    return test_db_path

def test_as_of_cutoff_1100(mock_db):
    """Verifies that at 11:00 cutoff on D-1, 10:30 run is selected and 14:00 run is excluded."""
    engine = AnalyticsEngine(db_path=mock_db)
    df = engine.get_aligned_data(
        start_date="2026-01-10",
        end_date="2026-01-10",
        cutoff_time="11:00:00"
    )

    assert len(df) == 2
    # Both SP 1 and SP 2 map to target hour 00:00:00Z
    row1 = df.iloc[0]
    assert row1["forecast_mw"] == 4500.0
    assert row1["forecast_publish_time"] == "2026-01-09T10:30:00Z"

def test_as_of_cutoff_1530(mock_db):
    """Verifies that with 15:30 cutoff, the 14:00 run is selected."""
    engine = AnalyticsEngine(db_path=mock_db)
    df = engine.get_aligned_data(
        start_date="2026-01-10",
        end_date="2026-01-10",
        cutoff_time="15:30:00"
    )

    assert len(df) == 2
    row1 = df.iloc[0]
    assert row1["forecast_mw"] == 6000.0
    assert row1["forecast_publish_time"] == "2026-01-09T14:00:00Z"

def test_as_of_cutoff_0900(mock_db):
    """Verifies that with 09:00 cutoff, only 08:00 run is eligible."""
    engine = AnalyticsEngine(db_path=mock_db)
    df = engine.get_aligned_data(
        start_date="2026-01-10",
        end_date="2026-01-10",
        cutoff_time="09:00:00"
    )

    assert len(df) == 2
    row1 = df.iloc[0]
    assert row1["forecast_mw"] == 4000.0
    assert row1["forecast_publish_time"] == "2026-01-09T08:00:00Z"
