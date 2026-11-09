from datetime import datetime, timezone, timedelta
from typing import Optional, Tuple
from sqlalchemy import select, delete, update
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.core.security import (
    compute_cache_key,
    encrypt_text,
    decrypt_text,
)
from app.core.logger import logger, log_sanitized_event
from app.models.translation_cache import TranslationCache


class TranslationCacheService:
    """
    Manages the encrypted persistent translation cache in PostgreSQL / SQLite.
    Prevents repeated GPT-6 Luna API calls for previously translated phrases.
    """

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_cached_translation(
        self,
        source_text: str,
        source_lang: str,
        target_lang: str,
        model_id: str = None,
        prompt_version: str = None,
        glossary_version: str = "v1",
    ) -> Optional[str]:
        """
        Looks up cached translation using HMAC key hash.
        If found and not expired, increments hit_count and returns decrypted text.
        """
        cache_key_hash, _ = compute_cache_key(
            source_text=source_text,
            source_lang=source_lang,
            target_lang=target_lang,
            model_id=model_id or settings.OPENAI_MODEL,
            prompt_version=prompt_version or settings.TRANSLATION_PROMPT_VERSION,
            glossary_version=glossary_version,
        )

        now = datetime.now(timezone.utc)
        stmt = select(TranslationCache).where(
            TranslationCache.cache_key_hash == cache_key_hash,
            TranslationCache.expires_at > now,
        )
        result = await self.db.execute(stmt)
        entry = result.scalar_one_or_none()

        if entry:
            # Increment hit count and update last_used_at
            entry.hit_count += 1
            entry.last_used_at = now
            await self.db.commit()

            decrypted = decrypt_text(entry.translated_text_encrypted)
            log_sanitized_event(
                "translation_cache_hit",
                source_lang=source_lang,
                target_lang=target_lang,
                hit_count=entry.hit_count,
            )
            return decrypted

        log_sanitized_event(
            "translation_cache_miss",
            source_lang=source_lang,
            target_lang=target_lang,
        )
        return None

    async def store_translation(
        self,
        source_text: str,
        source_lang: str,
        target_lang: str,
        translated_text: str,
        model_id: str = None,
        prompt_version: str = None,
        glossary_version: str = "v1",
        ttl_days: int = None,
    ) -> TranslationCache:
        """
        Stores encrypted translation in the database.
        """
        cache_key_hash, normalized_source_hash = compute_cache_key(
            source_text=source_text,
            source_lang=source_lang,
            target_lang=target_lang,
            model_id=model_id or settings.OPENAI_MODEL,
            prompt_version=prompt_version or settings.TRANSLATION_PROMPT_VERSION,
            glossary_version=glossary_version,
        )

        now = datetime.now(timezone.utc)
        ttl = ttl_days if ttl_days is not None else settings.TRANSLATION_CACHE_TTL_DAYS
        expires_at = now + timedelta(days=ttl)

        encrypted = encrypt_text(translated_text)

        # Check if an expired entry exists to update or insert new
        stmt = select(TranslationCache).where(TranslationCache.cache_key_hash == cache_key_hash)
        res = await self.db.execute(stmt)
        entry = res.scalar_one_or_none()

        if entry:
            entry.translated_text_encrypted = encrypted
            entry.last_used_at = now
            entry.expires_at = expires_at
            entry.hit_count = 1
        else:
            entry = TranslationCache(
                cache_key_hash=cache_key_hash,
                normalized_source_hash=normalized_source_hash,
                source_language=source_lang.strip(),
                target_language=target_lang.strip(),
                translated_text_encrypted=encrypted,
                model_id=model_id or settings.OPENAI_MODEL,
                prompt_version=prompt_version or settings.TRANSLATION_PROMPT_VERSION,
                created_at=now,
                last_used_at=now,
                hit_count=1,
                expires_at=expires_at,
            )
            self.db.add(entry)

        await self.db.commit()
        await self.db.refresh(entry)
        log_sanitized_event("translation_cached", source_lang=source_lang, target_lang=target_lang)
        return entry

    async def purge_expired(self) -> int:
        now = datetime.now(timezone.utc)
        stmt = delete(TranslationCache).where(TranslationCache.expires_at <= now)
        res = await self.db.execute(stmt)
        await self.db.commit()
        return res.rowcount

    async def purge_all(self) -> int:
        stmt = delete(TranslationCache)
        res = await self.db.execute(stmt)
        await self.db.commit()
        return res.rowcount

    async def get_stats(self) -> dict:
        now = datetime.now(timezone.utc)
        stmt = select(TranslationCache)
        res = await self.db.execute(stmt)
        entries = res.scalars().all()
        total_entries = len(entries)
        
        def is_active(e: TranslationCache) -> bool:
            exp = e.expires_at
            if exp.tzinfo is None:
                exp = exp.replace(tzinfo=timezone.utc)
            return exp > now

        active_entries = sum(1 for e in entries if is_active(e))
        total_hits = sum(e.hit_count for e in entries)
        return {
            "total_cached_entries": total_entries,
            "active_cached_entries": active_entries,
            "total_cache_hits": total_hits,
        }
