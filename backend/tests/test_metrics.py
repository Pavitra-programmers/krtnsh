import pytest
import pandas as pd
import numpy as np
from app.services.analytics import AnalyticsEngine

def test_metrics_empty():
    engine = AnalyticsEngine()
    empty_df = pd.DataFrame()
    m = engine.calculate_metrics(empty_df)
    assert m["count"] == 0
    assert m["mae"] == 0.0
    assert m["rmse"] == 0.0
    assert m["bias"] == 0.0

def test_metrics_exact_values():
    engine = AnalyticsEngine()
    # Synthetic test data:
    # Actual:   100, 200, 300, 400
    # Forecast: 110, 190, 330, 360
    # Error:    +10, -10, +30, -40
    # |Error|:   10,  10,  30,  40 -> MAE = 90 / 4 = 22.5
    # Error^2:  100, 100, 900, 1600 -> MSE = 2700 / 4 = 675 -> RMSE = sqrt(675) ~= 25.98
    # Bias:     (10 - 10 + 30 - 40) / 4 = -10 / 4 = -2.5
    # WAPE:     90 / 1000 * 100 = 9.0%
    data = {
        "actual_mw": [100.0, 200.0, 300.0, 400.0],
        "forecast_mw": [110.0, 190.0, 330.0, 360.0],
        "error_mw": [10.0, -10.0, 30.0, -40.0],
        "abs_error_mw": [10.0, 10.0, 30.0, 40.0],
        "sq_error_mw": [100.0, 100.0, 900.0, 1600.0]
    }
    df = pd.DataFrame(data)
    m = engine.calculate_metrics(df)

    assert m["count"] == 4
    assert m["mae"] == 22.5
    assert m["rmse"] == 25.98
    assert m["bias"] == -2.5
    assert m["wape"] == 9.0
    assert m["max_miss"] == 40.0

def test_metrics_zero_actuals():
    engine = AnalyticsEngine()
    # Physical state: zero wind actual
    data = {
        "actual_mw": [0.0, 0.0],
        "forecast_mw": [50.0, 100.0],
        "error_mw": [50.0, 100.0],
        "abs_error_mw": [50.0, 100.0],
        "sq_error_mw": [2500.0, 10000.0]
    }
    df = pd.DataFrame(data)
    m = engine.calculate_metrics(df)
    assert m["count"] == 2
    assert m["mae"] == 75.0
    assert m["bias"] == 75.0
    assert m["wape"] == 0.0  # Avoid division by zero
