import json
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.logger import logger
from app.db.session import init_db, AsyncSessionLocal
from app.api.routes import health, doctor, patients, consultations, transcripts, audio, cache, translate
from app.models.doctor import Doctor
from app.models.patient import Patient
from app.models.ui_cache import UILocalization
from app.services.translation.ui_dictionary import DEFAULT_UI_LOCALIZATIONS
from sqlalchemy import select


async def seed_demo_data():
    """Seeds default doctor profile and UI language localizations for SQLite database."""
    async with AsyncSessionLocal() as session:
        # Check doctor
        res = await session.execute(select(Doctor))
        if not res.scalars().first():
            doc = Doctor(
                name="Dr. Priya Sharma",
                credentials="MBBS, MD (General Medicine)",
                preferred_language="en-IN",
                spoken_languages="en-IN,mr-IN,hi-IN",
            )
            session.add(doc)
            logger.info("Seeded default doctor profile.")

        # Seed UI Localizations into SQLite database
        for lang_code, data in DEFAULT_UI_LOCALIZATIONS.items():
            loc_res = await session.execute(
                select(UILocalization).where(UILocalization.language_code == lang_code)
            )
            if not loc_res.scalars().first():
                loc = UILocalization(
                    language_code=lang_code,
                    language_name=data["name"],
                    translations_json=json.dumps(data["translations"], ensure_ascii=False),
                )
                session.add(loc)

        await session.commit()
        logger.info("Seeded UI language localizations in SQLite database.")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting SwasthyaSetu Backend...")
    await init_db()
    await seed_demo_data()
    yield
    logger.info("Shutting down SwasthyaSetu Backend...")


app = FastAPI(
    title=settings.APP_NAME,
    description="Multilingual Healthcare Communication & Clinical Documentation API",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS Middleware allowing mobile app access from LAN
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from pathlib import Path
from fastapi.staticfiles import StaticFiles

# Root health route
app.include_router(health.router)

# Versioned API routes under /api/v1
app.include_router(doctor.router, prefix=settings.API_V1_PREFIX)
app.include_router(patients.router, prefix=settings.API_V1_PREFIX)
app.include_router(consultations.router, prefix=settings.API_V1_PREFIX)
app.include_router(transcripts.router, prefix=settings.API_V1_PREFIX)
app.include_router(audio.router, prefix=settings.API_V1_PREFIX)
app.include_router(cache.router, prefix=settings.API_V1_PREFIX)
app.include_router(translate.router, prefix=settings.API_V1_PREFIX)

# Mount Web Frontend (HTML, CSS, JS) for instant browser access on desktop and mobile
FRONTEND_DIR = Path(__file__).resolve().parent.parent.parent / "frontend"
if FRONTEND_DIR.is_dir():
    app.mount("/", StaticFiles(directory=str(FRONTEND_DIR), html=True), name="frontend")



if __name__ == "__main__":
    import uvicorn
    # Bind to 0.0.0.0 for physical mobile phone testing on private LAN
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)

