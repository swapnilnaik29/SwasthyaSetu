import json
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.models.ui_cache import UILocalization
from app.services.translation.cache import TranslationCacheService
from app.services.translation.ui_dictionary import DEFAULT_UI_LOCALIZATIONS

router = APIRouter(prefix="/cache", tags=["Cache"])


@router.get("/ui")
async def get_all_ui_caches(db: AsyncSession = Depends(get_db)):
    """Retrieve all cached UI localizations stored in the SQLite database."""
    result = await db.execute(select(UILocalization).order_by(UILocalization.language_code))
    records = result.scalars().all()
    out = {}
    for r in records:
        try:
            out[r.language_code] = {
                "name": r.language_name,
                "translations": json.loads(r.translations_json),
            }
        except Exception:
            pass
    # If database not yet seeded, return defaults
    if not out:
        return DEFAULT_UI_LOCALIZATIONS
    return out


@router.get("/ui/{language_code}")
async def get_ui_cache(language_code: str, db: AsyncSession = Depends(get_db)):
    """Retrieve cached UI translations for a specific language from the SQLite database."""
    result = await db.execute(
        select(UILocalization).where(UILocalization.language_code == language_code)
    )
    rec = result.scalars().first()
    if not rec:
        default_data = DEFAULT_UI_LOCALIZATIONS.get(language_code) or DEFAULT_UI_LOCALIZATIONS.get("en-IN")
        if default_data:
            return {
                "language_code": language_code,
                "language_name": default_data["name"],
                "translations": default_data["translations"],
            }
        raise HTTPException(status_code=404, detail=f"UI localization for {language_code} not found")
    return {
        "language_code": rec.language_code,
        "language_name": rec.language_name,
        "translations": json.loads(rec.translations_json),
    }


@router.post("/ui/{language_code}")
async def save_ui_cache(language_code: str, payload: dict, db: AsyncSession = Depends(get_db)):
    """Upsert cached UI translations in the SQLite database."""
    result = await db.execute(
        select(UILocalization).where(UILocalization.language_code == language_code)
    )
    rec = result.scalars().first()
    trans_json = json.dumps(payload.get("translations", payload), ensure_ascii=False)
    name = payload.get("name", language_code)
    if rec:
        rec.translations_json = trans_json
        rec.language_name = name
    else:
        rec = UILocalization(
            language_code=language_code,
            language_name=name,
            translations_json=trans_json,
        )
        db.add(rec)
    await db.commit()
    await db.refresh(rec)
    return {"status": "saved", "language_code": language_code}


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

