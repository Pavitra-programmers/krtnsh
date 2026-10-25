from fastapi import APIRouter, Query, HTTPException
from app.services.analytics import AnalyticsEngine
from app.config import DEFAULT_CUTOFF_TIME

router = APIRouter()
engine = AnalyticsEngine()

@router.get("/forecasts")
def get_daily_forecast(
    date: str = Query("2026-01-15", description="Delivery date (YYYY-MM-DD)"),
    cutoff_time: str = Query(DEFAULT_CUTOFF_TIME, description="Cutoff time on D-1 (HH:MM:SS)"),
    resolution: str = Query("settlement_period", description="'settlement_period' or 'hourly'")
):
    df = engine.get_aligned_data(
        start_date=date,
        end_date=date,
        cutoff_time=cutoff_time,
        resolution=resolution
    )

    if df.empty:
        raise HTTPException(status_code=404, detail=f"No forecast or actual data found for date {date}")

    metrics = engine.calculate_metrics(df)

    periods = []
    for _, r in df.iterrows():
        sp_val = r.get("settlementPeriod", 0)
        sp = int(str(sp_val)) if sp_val is not None else 0
        mins = max(0, sp - 1) * 30
        h = mins // 60
        mn = mins % 60
        periods.append({
            "startTime": str(r["startTime"]),
            "settlementPeriod": sp,
            "time_label": f"{h:02d}:{mn:02d}",
            "actual_mw": round(float(r["actual_mw"]), 1),
            "forecast_mw": round(float(r["forecast_mw"]), 1),
            "error_mw": round(float(r["error_mw"]), 1),
            "forecast_publish_time": r.get("forecast_publish_time")
        })

    return {
        "date": date,
        "cutoff_time": cutoff_time,
        "resolution": resolution,
        "metrics": metrics,
        "periods": periods
    }
