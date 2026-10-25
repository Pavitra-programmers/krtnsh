from fastapi import APIRouter, Query
from app.services.analytics import AnalyticsEngine
from app.config import DEFAULT_START_DATE, DEFAULT_END_DATE, DEFAULT_CUTOFF_TIME

router = APIRouter()
engine = AnalyticsEngine()

@router.get("/overview")
def get_overview(
    start_date: str = Query(DEFAULT_START_DATE, description="Start delivery date (YYYY-MM-DD)"),
    end_date: str = Query(DEFAULT_END_DATE, description="End delivery date (YYYY-MM-DD)"),
    cutoff_time: str = Query(DEFAULT_CUTOFF_TIME, description="Cutoff time on D-1 (HH:MM:SS)"),
    resolution: str = Query("settlement_period", description="'settlement_period' (30-min) or 'hourly'")
):
    df = engine.get_aligned_data(
        start_date=start_date,
        end_date=end_date,
        cutoff_time=cutoff_time,
        resolution=resolution
    )

    metrics = engine.calculate_metrics(df)
    daily_breakdown = engine.get_daily_breakdown(df)

    timeseries = []
    if not df.empty:
        for _, r in df.iterrows():
            sp_val = r.get("settlementPeriod", 0)
            timeseries.append({
                "time": str(r["startTime"]),
                "settlementPeriod": int(str(sp_val)) if sp_val is not None else 0,
                "actual_mw": round(float(r["actual_mw"]), 1),
                "forecast_mw": round(float(r["forecast_mw"]), 1),
                "error_mw": round(float(r["error_mw"]), 1)
            })

    return {
        "parameters": {
            "start_date": start_date,
            "end_date": end_date,
            "cutoff_time": cutoff_time,
            "resolution": resolution
        },
        "metrics": metrics,
        "daily_breakdown": daily_breakdown,
        "timeseries": timeseries
    }
