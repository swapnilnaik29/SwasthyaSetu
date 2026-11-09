import uuid
from datetime import datetime, timezone
from sqlalchemy import String, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.session import Base


class Consultation(Base):
    __tablename__ = "consultations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patients.id", ondelete="CASCADE"), nullable=False, index=True)
    doctor_id: Mapped[str] = mapped_column(String(36), ForeignKey("doctors.id", ondelete="CASCADE"), nullable=False, index=True)
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    ended_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    doctor_language: Mapped[str] = mapped_column(String(10), default="en-IN")
    patient_language: Mapped[str] = mapped_column(String(10), default="hi-IN")
    mode: Mapped[str] = mapped_column(String(30), default="NORMAL")  # NORMAL (turn-by-turn) or AMBIENT_BACKGROUND
    status: Mapped[str] = mapped_column(String(20), default="ACTIVE")  # ACTIVE, COMPLETED, CANCELLED
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    patient = relationship("Patient", back_populates="consultations")
    doctor = relationship("Doctor", back_populates="consultations")
    transcripts = relationship("Transcript", back_populates="consultation", cascade="all, delete-orphan", order_by="Transcript.timestamp")
    draft = relationship("ConsultationDraft", back_populates="consultation", uselist=False, cascade="all, delete-orphan")
    clinical_record = relationship("ClinicalRecord", back_populates="consultation", uselist=False, cascade="all, delete-orphan")
    followups = relationship("Followup", back_populates="consultation", cascade="all, delete-orphan")

