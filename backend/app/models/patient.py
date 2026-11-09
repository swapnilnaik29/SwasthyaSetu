import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Integer, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.session import Base


class Patient(Base):
    __tablename__ = "patients"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    age: Mapped[int] = mapped_column(Integer, nullable=True)
    date_of_birth: Mapped[str] = mapped_column(String(20), nullable=True)
    mobile_number: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    preferred_language: Mapped[str] = mapped_column(String(10), default="hi-IN")
    gender: Mapped[str] = mapped_column(String(20), nullable=True)
    chief_complaint: Mapped[str] = mapped_column(String(500), nullable=True)
    symptoms_duration: Mapped[str] = mapped_column(String(100), nullable=True)
    known_allergies: Mapped[str] = mapped_column(String(500), nullable=True)
    current_medications: Mapped[str] = mapped_column(String(500), nullable=True)
    past_medical_history: Mapped[str] = mapped_column(String(500), nullable=True)
    intake_summary_english: Mapped[str] = mapped_column(String(1000), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    consultations = relationship("Consultation", back_populates="patient", cascade="all, delete-orphan")
    medical_histories = relationship("MedicalHistory", back_populates="patient", cascade="all, delete-orphan")

