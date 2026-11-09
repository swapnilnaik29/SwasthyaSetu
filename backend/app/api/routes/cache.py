from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.services.translation.cache import TranslationCacheService

router = APIRouter(prefix="/cache", tags=["Cache"])


@router.get("/stats")
async def get_cache_stats(db: AsyncSession = Depends(get_db)):
    """Retrieve translation cache metrics (total entries, hit counts)."""
    service = TranslationCacheService(db)
    stats = await service.get_stats()
    return stats


@router.post("/purge")
async def purge_cache(
    all_entries: bool = Query(False, description="Purge all entries if True, or only expired entries if False"),
    db: AsyncSession = Depends(get_db),
):
    """Purge translation cache entries."""
    service = TranslationCacheService(db)
    if all_entries:
        purged = await service.purge_all()
    else:
        purged = await service.purge_expired()
    return {"status": "success", "purged_count": purged}

