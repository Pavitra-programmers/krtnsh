from fastapi import APIRouter
from app.db import get_counts

router = APIRouter()

@router.get("/health")
def get_health():
    counts = get_counts()
    is_ready = counts["fuelhh_wind_records"] > 0 and counts["windfor_forecast_records"] > 0
    return {
        "status": "healthy",
        "service": "UK Day-Ahead Wind Forecast Decision Portal",
        "database_ready": is_ready,
        "inventory": counts
    }
