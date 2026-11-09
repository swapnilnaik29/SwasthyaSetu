from app.schemas.doctor import DoctorSettings, DoctorUpdate, DoctorOut
from app.schemas.patient import PatientCreate, PatientUpdate, PatientOut
from app.schemas.consultation import (
    ConsultationCreate,
    ConsultationOut,
    TranscriptOut,
    TranscriptUpdate,
    TurnProcessResult,
)
from app.schemas.draft import (
    SymptomItem,
    PrescriptionItem,
    StructuredDraftPayload,
    DraftOut,
    DraftUpdate,
    ClinicalRecordOut,
)
from app.schemas.followup import FollowupCreate, FollowupOut

__all__ = [
    "DoctorSettings",
    "DoctorUpdate",
    "DoctorOut",
    "PatientCreate",
    "PatientUpdate",
    "PatientOut",
    "ConsultationCreate",
    "ConsultationOut",
    "TranscriptOut",
    "TranscriptUpdate",
    "TurnProcessResult",
    "SymptomItem",
    "PrescriptionItem",
    "StructuredDraftPayload",
    "DraftOut",
    "DraftUpdate",
    "ClinicalRecordOut",
    "FollowupCreate",
    "FollowupOut",
]

