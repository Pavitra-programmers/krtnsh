from fastapi import APIRouter, Query
from app.db import get_db, get_counts
from app.config import DEFAULT_START_DATE, DEFAULT_END_DATE

router = APIRouter()

@router.get("/data-quality")
def get_data_quality(
    start_date: str = Query(DEFAULT_START_DATE),
    end_date: str = Query(DEFAULT_END_DATE)
):
    counts = get_counts()
    with get_db() as conn:
        # Completeness audit on FUELHH
        fuel_stats = conn.execute("""
            SELECT 
                COUNT(*) as total_rows,
                COUNT(DISTINCT settlementDate) as distinct_dates,
                MIN(generation) as min_gen,
                MAX(generation) as max_gen,
                SUM(CASE WHEN generation IS NULL THEN 1 ELSE 0 END) as null_count,
                SUM(CASE WHEN generation < 0 THEN 1 ELSE 0 END) as negative_count
            FROM fuelhh
            WHERE fuelType = 'WIND'
              AND settlementDate >= ? AND settlementDate <= ?;
        """, (start_date, end_date)).fetchone()

        # Completeness audit on WINDFOR
        wind_stats = conn.execute("""
            SELECT 
                COUNT(*) as total_rows,
                COUNT(DISTINCT startTime) as distinct_target_hours,
                COUNT(DISTINCT publishTime) as distinct_vintages,
                MIN(generation) as min_gen,
                MAX(generation) as max_gen,
                SUM(CASE WHEN generation IS NULL THEN 1 ELSE 0 END) as null_count
            FROM windfor
            WHERE startTime >= ? AND startTime <= ?;
        """, (f"{start_date}T00:00:00Z", f"{end_date}T23:59:59Z")).fetchone()

        # Sample raw records for transparency
        sample_fuel = conn.execute("""
            SELECT publishTime, startTime, settlementDate, settlementPeriod, generation
            FROM fuelhh
            WHERE fuelType = 'WIND' AND settlementDate = ?
            ORDER BY settlementPeriod ASC LIMIT 5;
        """, (start_date,)).fetchall()

        sample_wind = conn.execute("""
            SELECT publishTime, startTime, generation
            FROM windfor
            WHERE startTime LIKE ?
            ORDER BY publishTime DESC LIMIT 5;
        """, (f"{start_date}%",)).fetchall()

    expected_sps = 31 * 48  # 1,488 for January
    actual_sps = fuel_stats[0] if fuel_stats else 0
    coverage_pct = round((actual_sps / expected_sps * 100.0) if expected_sps > 0 else 0, 2)

    return {
        "dataset_scope": {
            "start_date": start_date,
            "end_date": end_date,
            "expected_settlement_periods": expected_sps,
            "actual_fuelhh_periods": actual_sps,
            "coverage_percentage": coverage_pct
        },
        "inventory": counts,
        "fuelhh_audit": {
            "total_rows": fuel_stats[0],
            "distinct_dates": fuel_stats[1],
            "min_mw": fuel_stats[2],
            "max_mw": fuel_stats[3],
            "null_count": fuel_stats[4],
            "negative_count": fuel_stats[5],
            "sample_records": [dict(r) for r in sample_fuel]
        },
        "windfor_audit": {
            "total_rows": wind_stats[0],
            "distinct_target_hours": wind_stats[1],
            "distinct_vintages": wind_stats[2],
            "min_mw": wind_stats[3],
            "max_mw": wind_stats[4],
            "null_count": wind_stats[5],
            "sample_records": [dict(r) for r in sample_wind]
        }
    }
