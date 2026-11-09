import uuid
from datetime import datetime, timezone
from sqlalchemy import String, DateTime, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.session import Base


class Transcript(Base):
    """
    Stores consultation speech turns.
    CRITICAL: In compliance with the canonical storage policy, only the English
    canonical text is persisted in this table. Raw non-English transcript text is
    never stored in this clinical record table.
    """
    __tablename__ = "transcripts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    consultation_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("consultations.id", ondelete="CASCADE"), nullable=False, index=True
    )
    speaker: Mapped[str] = mapped_column(String(10), nullable=False)  # PATIENT or DOCTOR
    canonical_english_text: Mapped[str] = mapped_column(String(4000), nullable=False)
    source_language: Mapped[str] = mapped_column(String(10), nullable=False)
    recipient_language: Mapped[str] = mapped_column(String(10), nullable=False)
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    confidence_metadata: Mapped[dict] = mapped_column(JSON, nullable=True, default=dict)

    consultation = relationship("Consultation", back_populates="transcripts")
