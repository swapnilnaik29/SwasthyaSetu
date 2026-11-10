import uuid
from datetime import datetime, timezone
from sqlalchemy import String, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.session import Base


class Doctor(Base):
    __tablename__ = "doctors"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    credentials: Mapped[str] = mapped_column(String(255), default="MBBS, MD")
    preferred_language: Mapped[str] = mapped_column(String(10), default="en-IN")  # primary language
    spoken_languages: Mapped[str] = mapped_column(String(255), default="en-IN,mr-IN")  # comma-separated languages doctor speaks/understands
    doctor_voice: Mapped[str] = mapped_column(String(50), default="Deven (Male)", nullable=True)
    patient_voice: Mapped[str] = mapped_column(String(50), default="Auto (Matches Gender)", nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    consultations = relationship("Consultation", back_populates="doctor", cascade="all, delete-orphan")

