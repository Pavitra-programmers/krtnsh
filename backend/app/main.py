import os
import logging
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from app.config import DEBUG
from app.db import init_db, get_counts
from app.services.elexon import ElexonService
from app.routes import health, overview, forecasts, accuracy, simulator, vintages, data_quality, sync

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("wind_portal")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB schema
    logger.info("Initializing database...")
    init_db()
    
    # Check if database has data
    counts = get_counts()
    logger.info("Current DB status: %s", counts)
    if counts["fuelhh_wind_records"] == 0 or counts["windfor_forecast_records"] == 0:
        logger.info("Database is empty. Initiating automatic data bootstrap from Elexon BMRS...")
        service = ElexonService()
        try:
            await service.sync_data()
        except Exception as e:
            logger.error("Error during initial bootstrap sync: %s", e)
    
    yield
    logger.info("Shutting down application...")

app = FastAPI(
    title="UK Day-Ahead Wind Forecast & Decision Portal",
    description="Trading desk decision support and quantitative forecast accuracy analytics using official Elexon BMRS data for January 2026.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routers
app.include_router(health.router, tags=["Health"])
app.include_router(overview.router, prefix="/api", tags=["Overview"])
app.include_router(forecasts.router, prefix="/api", tags=["Forecasts"])
app.include_router(accuracy.router, prefix="/api", tags=["Accuracy"])
app.include_router(simulator.router, prefix="/api", tags=["Simulator"])
app.include_router(vintages.router, prefix="/api", tags=["Vintages"])
app.include_router(data_quality.router, prefix="/api", tags=["Data Quality"])
app.include_router(sync.router, prefix="/api", tags=["Sync"])

# Serve frontend build in production if present
FRONTEND_DIST = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"
if FRONTEND_DIST.exists() and (FRONTEND_DIST / "index.html").exists():
    app.mount("/assets", StaticFiles(directory=str(FRONTEND_DIST / "assets")), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str):
        file_path = FRONTEND_DIST / full_path
        if file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(FRONTEND_DIST / "index.html")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
