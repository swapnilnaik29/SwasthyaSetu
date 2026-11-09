from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.logger import logger
from app.db.session import init_db, AsyncSessionLocal
from app.api.routes import health, doctor, patients, consultations, transcripts, audio, cache
from app.models.doctor import Doctor
from app.models.patient import Patient
from sqlalchemy import select


async def seed_demo_data():
    """Seeds default doctor and demo fictional patients for hackathon presentation."""
    async with AsyncSessionLocal() as session:
        # Check doctor
        res = await session.execute(select(Doctor))
        if not res.scalars().first():
            doc = Doctor(
                name="Dr. Priya Sharma",
                credentials="MBBS, MD (General Medicine)",
                preferred_language="en-IN",
            )
            session.add(doc)
            await session.commit()
            logger.info("Seeded default doctor profile.")

        # Check patients
        res_pat = await session.execute(select(Patient))
        if not res_pat.scalars().first():
            demo_patients = [
                Patient(
                    name="Ramesh Kumar",
                    age=38,
                    mobile_number="9876543210",
                    preferred_language="hi-IN",
                ),
                Patient(
                    name="Sunita Patil",
                    age=45,
                    mobile_number="9812345678",
                    preferred_language="mr-IN",
                ),
                Patient(
                    name="Vikram Singh",
                    age=29,
                    mobile_number="9988776655",
                    preferred_language="hi-IN",
                ),
            ]
            session.add_all(demo_patients)
            await session.commit()
            logger.info("Seeded fictional demo patients.")


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

# Mount Web Frontend (HTML, CSS, JS) for instant browser access on desktop and mobile
FRONTEND_DIR = Path(__file__).resolve().parent.parent.parent / "frontend"
if FRONTEND_DIR.is_dir():
    app.mount("/", StaticFiles(directory=str(FRONTEND_DIR), html=True), name="frontend")



if __name__ == "__main__":
    import uvicorn
    # Bind to 0.0.0.0 for physical mobile phone testing on private LAN
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)

