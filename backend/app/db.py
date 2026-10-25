import sqlite3
import logging
from typing import List, Dict, Any, Optional
from contextlib import contextmanager
from app.config import DB_PATH

logger = logging.getLogger(__name__)

@contextmanager
def get_db(db_path: str = DB_PATH):
    conn = sqlite3.connect(db_path, timeout=30.0)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA synchronous=NORMAL;")
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

def init_db(db_path: str = DB_PATH):
    """Initializes tables and high-performance analytical indexes."""
    with get_db(db_path) as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS fuelhh (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                publishTime TEXT NOT NULL,
                startTime TEXT NOT NULL,
                settlementDate TEXT NOT NULL,
                settlementPeriod INTEGER NOT NULL,
                fuelType TEXT NOT NULL,
                generation REAL NOT NULL,
                UNIQUE(startTime, settlementPeriod, fuelType)
            );
        """)
        conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_fuelhh_start ON fuelhh(startTime);
        """)
        conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_fuelhh_date ON fuelhh(settlementDate);
        """)
        conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_fuelhh_fuel ON fuelhh(fuelType);
        """)

        conn.execute("""
            CREATE TABLE IF NOT EXISTS windfor (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                publishTime TEXT NOT NULL,
                startTime TEXT NOT NULL,
                generation REAL NOT NULL,
                UNIQUE(publishTime, startTime)
            );
        """)
        conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_windfor_start_pub ON windfor(startTime, publishTime);
        """)
        conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_windfor_pub ON windfor(publishTime);
        """)
        conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_windfor_start ON windfor(startTime);
        """)

        conn.execute("""
            CREATE TABLE IF NOT EXISTS metadata (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL,
                updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
            );
        """)
        logger.info("Database initialized successfully at %s", db_path)

def save_fuelhh_batch(records: List[Dict[str, Any]], db_path: str = DB_PATH) -> int:
    """Inserts or replaces a batch of FUELHH actuals."""
    if not records:
        return 0
    sql = """
        INSERT OR REPLACE INTO fuelhh 
        (publishTime, startTime, settlementDate, settlementPeriod, fuelType, generation)
        VALUES (?, ?, ?, ?, ?, ?);
    """
    params = [
        (
            r.get("publishTime", ""),
            r.get("startTime", ""),
            r.get("settlementDate", ""),
            int(r.get("settlementPeriod", 0)),
            r.get("fuelType", "WIND"),
            float(r.get("generation", 0.0))
        )
        for r in records
        if r.get("fuelType") == "WIND" and r.get("startTime")
    ]
    with get_db(db_path) as conn:
        conn.executemany(sql, params)
    return len(params)

def save_windfor_batch(records: List[Dict[str, Any]], db_path: str = DB_PATH) -> int:
    """Inserts or replaces a batch of WINDFOR forecasts."""
    if not records:
        return 0
    sql = """
        INSERT OR REPLACE INTO windfor (publishTime, startTime, generation)
        VALUES (?, ?, ?);
    """
    params = [
        (
            r.get("publishTime", ""),
            r.get("startTime", ""),
            float(r.get("generation", 0.0))
        )
        for r in records
        if r.get("publishTime") and r.get("startTime") and r.get("generation") is not None
    ]
    with get_db(db_path) as conn:
        conn.executemany(sql, params)
    return len(params)

def get_counts(db_path: str = DB_PATH) -> Dict[str, Any]:
    with get_db(db_path) as conn:
        f_count = conn.execute("SELECT COUNT(*) FROM fuelhh WHERE fuelType='WIND';").fetchone()[0]
        w_count = conn.execute("SELECT COUNT(*) FROM windfor;").fetchone()[0]
        f_min_max = conn.execute("SELECT MIN(startTime), MAX(startTime) FROM fuelhh WHERE fuelType='WIND';").fetchone()
        w_min_max = conn.execute("SELECT MIN(publishTime), MAX(publishTime) FROM windfor;").fetchone()
        last_sync = conn.execute("SELECT value, updatedAt FROM metadata WHERE key='last_sync';").fetchone()

        return {
            "fuelhh_wind_records": f_count,
            "windfor_forecast_records": w_count,
            "fuelhh_range": {"min": f_min_max[0], "max": f_min_max[1]} if f_min_max else None,
            "windfor_pub_range": {"min": w_min_max[0], "max": w_min_max[1]} if w_min_max else None,
            "last_sync": dict(last_sync) if last_sync else None
        }

def update_metadata(key: str, value: str, db_path: str = DB_PATH):
    with get_db(db_path) as conn:
        conn.execute("""
            INSERT OR REPLACE INTO metadata (key, value, updatedAt)
            VALUES (?, ?, datetime('now'));
        """, (key, value))
