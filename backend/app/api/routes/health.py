import socket
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.db.session import get_db
from app.core.config import settings

router = APIRouter(tags=["Health"])


def get_local_ip() -> str:
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"


@router.get("/health")
async def health_check(db: AsyncSession = Depends(get_db)):
    """Health check endpoint validating service and database status."""
    db_ok = False
    try:
        await db.execute(text("SELECT 1"))
        db_ok = True
    except Exception:
        db_ok = False

    return {
        "status": "healthy" if db_ok else "degraded",
        "app_name": settings.APP_NAME,
        "app_env": settings.APP_ENV,
        "database": "SQLite (Local High-Performance WAL)",
        "database_connected": db_ok,
        "openai_model": settings.OPENAI_MODEL,
        "gnani_stt_model": settings.GNANI_STT_MODEL,
        "gnani_tts_model": settings.GNANI_TTS_MODEL,
        "server_lan_ip": get_local_ip(),
        "api_v1_prefix": settings.API_V1_PREFIX,
    }

