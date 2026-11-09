from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.models.doctor import Doctor
from app.schemas.doctor import DoctorOut, DoctorSettings, DoctorUpdate

router = APIRouter(prefix="/doctor", tags=["Doctor"])


async def get_or_create_default_doctor(db: AsyncSession) -> Doctor:
    stmt = select(Doctor).order_by(Doctor.created_at)
    res = await db.execute(stmt)
    doc = res.scalar_one_or_none()
    if not doc:
        doc = Doctor(
            name="Dr. Priya Sharma",
            credentials="MBBS, MD (General Medicine)",
            preferred_language="en-IN",
        )
        db.add(doc)
        await db.commit()
        await db.refresh(doc)
    return doc


@router.get("/settings", response_model=DoctorOut)
async def get_doctor_settings(db: AsyncSession = Depends(get_db)):
    """Retrieve current doctor profile and preferred language."""
    doctor = await get_or_create_default_doctor(db)
    return doctor


@router.put("/settings", response_model=DoctorOut)
async def update_doctor_settings(settings_in: DoctorSettings, db: AsyncSession = Depends(get_db)):
    """Update doctor profile and preferred language."""
    doctor = await get_or_create_default_doctor(db)
    doctor.name = settings_in.name
    doctor.credentials = settings_in.credentials
    doctor.preferred_language = settings_in.preferred_language
    await db.commit()
    await db.refresh(doctor)
    return doctor
