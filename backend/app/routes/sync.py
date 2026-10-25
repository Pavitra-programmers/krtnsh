import asyncio
from fastapi import APIRouter, BackgroundTasks
from app.services.elexon import ElexonService

router = APIRouter()
elexon_service = ElexonService()

@router.post("/sync")
async def trigger_sync(background_tasks: BackgroundTasks):
    """Triggers background data harvest from Elexon BMRS stream API."""
    background_tasks.add_task(elexon_service.sync_data)
    return {
        "status": "initiated",
        "message": "Background synchronization with Elexon BMRS initiated."
    }
