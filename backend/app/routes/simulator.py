from fastapi import APIRouter, Query
from app.services.analytics import AnalyticsEngine
from app.config import DEFAULT_CUTOFF_TIME

router = APIRouter()
engine = AnalyticsEngine()

@router.get("/simulator")
def run_procurement_simulator(
    date: str = Query("2026-01-15", description="Delivery date (YYYY-MM-DD)"),
    cutoff_time: str = Query(DEFAULT_CUTOFF_TIME, description="Cutoff time on D-1 (HH:MM:SS)"),
    strategy: str = Query("p50", description="Procurement strategy: 'p50', 'p80', 'p90', or 'p10'"),
    demand_peak_mw: float = Query(38000.0, description="Peak customer demand MW for the delivery day")
):
    result = engine.simulate_procurement(
        target_date=date,
        cutoff_time=cutoff_time,
        strategy=strategy,
        demand_peak_mw=demand_peak_mw
    )
    return result
