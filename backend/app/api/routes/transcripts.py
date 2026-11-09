from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.models.transcript import Transcript
from app.schemas.consultation import TranscriptOut, TranscriptUpdate

router = APIRouter(prefix="/transcripts", tags=["Transcripts"])


@router.patch("/{transcript_id}", response_model=TranscriptOut)
async def update_transcript(
    transcript_id: str,
    update_in: TranscriptUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Allow doctor to manually edit canonical English transcript."""
    transcript = await db.get(Transcript, transcript_id)
    if not transcript:
        raise HTTPException(status_code=404, detail="Transcript not found")

    transcript.canonical_english_text = update_in.canonical_english_text.strip()
    await db.commit()
    await db.refresh(transcript)
    return transcript

