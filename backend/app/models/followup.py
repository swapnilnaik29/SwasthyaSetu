import uuid
from datetime import datetime, timezone
from sqlalchemy import String, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.session import Base


class Followup(Base):
    __tablename__ = "followups"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    consultation_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("consultations.id", ondelete="CASCADE"), nullable=False, index=True
    )
    appointment_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    phone_number: Mapped[str] = mapped_column(String(20), nullable=False)
    sms_status: Mapped[str] = mapped_column(String(50), default="PENDING")  # PENDING, SENT, FAILED
    provider_message_id: Mapped[str] = mapped_column(String(100), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    consultation = relationship("Consultation", back_populates="followups")

