import uuid
from datetime import datetime, timezone
from sqlalchemy import String, DateTime, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.session import Base


class ClinicalRecord(Base):
    """
    Approved medical record.
    Only doctor-approved clinical information is stored here.
    Canonical language is strictly English.
    """
    __tablename__ = "clinical_records"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    consultation_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("consultations.id", ondelete="CASCADE"), nullable=False, unique=True, index=True
    )
    approved_payload: Mapped[dict] = mapped_column(JSON, nullable=False)
    approved_by: Mapped[str] = mapped_column(String(36), ForeignKey("doctors.id"), nullable=False)
    approved_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    consultation = relationship("Consultation", back_populates="clinical_record")
    doctor = relationship("Doctor")
