import os
from pathlib import Path

# Base directories
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)

# Database path
DB_PATH = os.getenv("DB_PATH", str(DATA_DIR / "wind_data.db"))

# Elexon BMRS API Config
ELEXON_BASE_URL = os.getenv("ELEXON_BASE_URL", "https://data.elexon.co.uk/bmrs/api/v1")

# Default Target Decision Scope: January 2026
DEFAULT_START_DATE = os.getenv("DEFAULT_START_DATE", "2026-01-01")
DEFAULT_END_DATE = os.getenv("DEFAULT_END_DATE", "2026-01-31")

# Query horizon bounds (include late Dec 2025 for day-ahead forecasts of early Jan 2026)
INGEST_START = os.getenv("INGEST_START", "2025-12-28T00:00:00Z")
INGEST_END = os.getenv("INGEST_END", "2026-02-03T00:00:00Z")

# Default Day-Ahead Gate Closure Cutoff (11:00 UTC for EPEX Day-Ahead Auction)
DEFAULT_CUTOFF_TIME = os.getenv("DEFAULT_CUTOFF_TIME", "11:00:00")

# App settings
APP_HOST = os.getenv("HOST", "0.0.0.0")
APP_PORT = int(os.getenv("PORT", "8000"))
DEBUG = os.getenv("DEBUG", "false").lower() == "true"
