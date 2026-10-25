from fastapi import APIRouter, Query
from app.services.analytics import AnalyticsEngine
from app.config import DEFAULT_START_DATE, DEFAULT_END_DATE, DEFAULT_CUTOFF_TIME

router = APIRouter()
engine = AnalyticsEngine()

@router.get("/accuracy")
def get_accuracy_analysis(
    start_date: str = Query(DEFAULT_START_DATE, description="Start date (YYYY-MM-DD)"),
    end_date: str = Query(DEFAULT_END_DATE, description="End date (YYYY-MM-DD)"),
    cutoff_time: str = Query(DEFAULT_CUTOFF_TIME, description="Cutoff time on D-1 (HH:MM:SS)"),
    resolution: str = Query("settlement_period", description="'settlement_period' or 'hourly'")
):
    df = engine.get_aligned_data(
        start_date=start_date,
        end_date=end_date,
        cutoff_time=cutoff_time,
        resolution=resolution
    )

    metrics = engine.calculate_metrics(df)
    daily_breakdown = engine.get_daily_breakdown(df)
    diurnal_profile = engine.get_diurnal_profile(df)
    error_distribution = engine.get_error_distribution(df)
    scatter_sample = engine.get_scatter_sample(df)
    lead_time_decay = engine.get_lead_time_decay(start_date=start_date, end_date=end_date)

    return {
        "parameters": {
            "start_date": start_date,
            "end_date": end_date,
            "cutoff_time": cutoff_time,
            "resolution": resolution
        },
        "metrics": metrics,
        "daily_breakdown": daily_breakdown,
        "diurnal_profile": diurnal_profile,
        "error_distribution": error_distribution,
        "scatter_sample": scatter_sample,
        "lead_time_decay": lead_time_decay
    }
