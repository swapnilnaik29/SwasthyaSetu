import uuid
from datetime import datetime, timezone
from sqlalchemy import String, DateTime, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.db.session import Base


class UILocalization(Base):
    """
    Cached UI Localization strings persisted in SQLite database.
    Allows instant switching between English, Hindi, Marathi, etc.
    with client-side fallback and API sync.
    """
    __tablename__ = "ui_localizations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    language_code: Mapped[str] = mapped_column(String(10), unique=True, index=True, nullable=False)
    language_name: Mapped[str] = mapped_column(String(50), nullable=False)
    translations_json: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc)
    )

