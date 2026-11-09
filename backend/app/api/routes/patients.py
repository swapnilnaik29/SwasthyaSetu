from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from app.db.session import get_db
from app.models.patient import Patient
from app.models.consultation import Consultation
from app.schemas.patient import PatientCreate, PatientUpdate, PatientOut
from app.schemas.consultation import ConsultationOut

router = APIRouter(prefix="/patients", tags=["Patients"])


@router.get("", response_model=List[PatientOut])
async def list_patients(
    q: Optional[str] = Query(None, description="Search query by name or phone number"),
    db: AsyncSession = Depends(get_db),
):
    """List and search patients."""
    stmt = select(Patient).order_by(Patient.created_at.desc())
    if q:
        query_clean = f"%{q.strip()}%"
        stmt = stmt.where(
            or_(
                Patient.name.ilike(query_clean),
                Patient.mobile_number.ilike(query_clean),
            )
        )
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post("", response_model=PatientOut, status_code=201)
async def create_patient(
    patient_in: PatientCreate,
    db: AsyncSession = Depends(get_db),
):
    """Register a new patient."""
    patient = Patient(
        name=patient_in.name,
        age=patient_in.age,
        date_of_birth=patient_in.date_of_birth,
        mobile_number=patient_in.mobile_number,
        preferred_language=patient_in.preferred_language,
    )
    db.add(patient)
    await db.commit()
    await db.refresh(patient)
    return patient


@router.get("/{patient_id}", response_model=PatientOut)
async def get_patient(
    patient_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Retrieve patient by ID."""
    stmt = select(Patient).where(Patient.id == patient_id)
    result = await db.execute(stmt)
    patient = result.scalar_one_or_none()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient


@router.patch("/{patient_id}", response_model=PatientOut)
async def update_patient(
    patient_id: str,
    patient_in: PatientUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Update patient details."""
    stmt = select(Patient).where(Patient.id == patient_id)
    result = await db.execute(stmt)
    patient = result.scalar_one_or_none()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    update_data = patient_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(patient, field, value)

    await db.commit()
    await db.refresh(patient)
    return patient


@router.get("/{patient_id}/consultations", response_model=List[ConsultationOut])
async def get_patient_consultations(
    patient_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Retrieve all consultations for a patient."""
    stmt = select(Consultation).where(Consultation.patient_id == patient_id).order_by(Consultation.started_at.desc())
    result = await db.execute(stmt)
    return result.scalars().all()

