from fastapi import APIRouter, Query
from app.services.analytics import AnalyticsEngine

router = APIRouter()
engine = AnalyticsEngine()

@router.get("/vintages/evolution")
def get_vintage_evolution(
    date: str = Query("2026-01-15", description="Delivery date (YYYY-MM-DD)"),
    hour: str = Query("12:00:00", description="Target delivery hour (HH:MM:SS)")
):
    result = engine.get_vintage_evolution(delivery_date=date, target_hour=hour)
    return result
