import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Integer, DateTime, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.db.session import Base


class TranslationCache(Base):
    """
    Persistent encrypted translation cache.
    Permitted exception to the English-only canonical rule solely to avoid redundant API calls.
    The translated target-language output is encrypted at rest with AES-GCM.
    Lookup is performed via HMAC key hash; no plaintext source is stored in the key.
    """
    __tablename__ = "translation_cache"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    cache_key_hash: Mapped[str] = mapped_column(String(64), nullable=False, unique=True, index=True)
    normalized_source_hash: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    source_language: Mapped[str] = mapped_column(String(10), nullable=False)
    target_language: Mapped[str] = mapped_column(String(10), nullable=False)
    translated_text_encrypted: Mapped[str] = mapped_column(Text, nullable=False)
    model_id: Mapped[str] = mapped_column(String(64), nullable=False, default="gpt-6-luna")
    prompt_version: Mapped[str] = mapped_column(String(20), nullable=False, default="v1")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    last_used_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    hit_count: Mapped[int] = mapped_column(Integer, default=0)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

