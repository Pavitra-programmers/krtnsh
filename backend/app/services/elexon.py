import logging
import asyncio
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any, Optional
import httpx
from app.config import ELEXON_BASE_URL, INGEST_START, INGEST_END
from app.db import save_fuelhh_batch, save_windfor_batch, update_metadata

logger = logging.getLogger(__name__)

class ElexonService:
    def __init__(self, base_url: str = ELEXON_BASE_URL, timeout: float = 45.0):
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout

    async def fetch_fuelhh_stream(
        self,
        client: httpx.AsyncClient,
        date_from: str,
        date_to: str,
        fuel_type: str = "WIND"
    ) -> List[Dict[str, Any]]:
        url = f"{self.base_url}/datasets/FUELHH/stream"
        params = {
            "publishDateTimeFrom": date_from,
            "publishDateTimeTo": date_to,
            "fuelType": fuel_type,
        }
        resp = await client.get(url, params=params, timeout=self.timeout)
        resp.raise_for_status()
        return resp.json()

    async def fetch_windfor_stream(
        self,
        client: httpx.AsyncClient,
        date_from: str,
        date_to: str
    ) -> List[Dict[str, Any]]:
        url = f"{self.base_url}/datasets/WINDFOR/stream"
        params = {
            "publishDateTimeFrom": date_from,
            "publishDateTimeTo": date_to,
        }
        resp = await client.get(url, params=params, timeout=self.timeout)
        resp.raise_for_status()
        return resp.json()

    async def sync_data(
        self,
        start_iso: str = INGEST_START,
        end_iso: str = INGEST_END,
        progress_cb: Optional[Any] = None
    ) -> Dict[str, Any]:
        """
        Synchronizes historical actuals and forecast streams from Elexon BMRS into SQLite.
        Chunks date ranges into safe windows to prevent upstream gateway timeouts.
        """
        logger.info("Starting Elexon sync from %s to %s", start_iso, end_iso)
        start_dt = datetime.fromisoformat(start_iso.replace("Z", "+00:00"))
        end_dt = datetime.fromisoformat(end_iso.replace("Z", "+00:00"))

        total_fuelhh = 0
        total_windfor = 0

        async with httpx.AsyncClient() as client:
            # 1. Ingest FUELHH in 7-day chunks
            cur = start_dt
            fuel_step = timedelta(days=7)
            while cur < end_dt:
                next_cur = min(cur + fuel_step, end_dt)
                f_from = cur.strftime("%Y-%m-%dT%H:%M:%SZ")
                f_to = next_cur.strftime("%Y-%m-%dT%H:%M:%SZ")
                try:
                    logger.info("Fetching FUELHH [%s -> %s]", f_from, f_to)
                    data = await self.fetch_fuelhh_stream(client, f_from, f_to, fuel_type="WIND")
                    saved = save_fuelhh_batch(data)
                    total_fuelhh += saved
                    logger.info("Saved %d FUELHH records", saved)
                except Exception as e:
                    logger.error("Error fetching FUELHH [%s -> %s]: %s", f_from, f_to, e)
                cur = next_cur

            # 2. Ingest WINDFOR in 4-day chunks
            cur = start_dt
            wind_step = timedelta(days=4)
            while cur < end_dt:
                next_cur = min(cur + wind_step, end_dt)
                w_from = cur.strftime("%Y-%m-%dT%H:%M:%SZ")
                w_to = next_cur.strftime("%Y-%m-%dT%H:%M:%SZ")
                try:
                    logger.info("Fetching WINDFOR [%s -> %s]", w_from, w_to)
                    data = await self.fetch_windfor_stream(client, w_from, w_to)
                    saved = save_windfor_batch(data)
                    total_windfor += saved
                    logger.info("Saved %d WINDFOR records", saved)
                except Exception as e:
                    logger.error("Error fetching WINDFOR [%s -> %s]: %s", w_from, w_to, e)
                cur = next_cur

        now_str = datetime.now(timezone.utc).isoformat()
        update_metadata("last_sync", now_str)
        update_metadata("last_sync_fuelhh_count", str(total_fuelhh))
        update_metadata("last_sync_windfor_count", str(total_windfor))

        logger.info("Sync completed: %d FUELHH, %d WINDFOR", total_fuelhh, total_windfor)
        return {
            "status": "success",
            "fuelhh_records": total_fuelhh,
            "windfor_records": total_windfor,
            "synced_at": now_str
        }
