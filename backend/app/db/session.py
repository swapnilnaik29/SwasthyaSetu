from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import declarative_base
from sqlalchemy import event
from app.core.config import settings
from app.core.logger import logger

# Base model for SQLAlchemy ORM
Base = declarative_base()

# Configure Async Engine
database_url = settings.DATABASE_URL
connect_args = {}
if database_url.startswith("sqlite"):
    connect_args["check_same_thread"] = False

engine = create_async_engine(
    database_url,
    echo=False,
    connect_args=connect_args,
    pool_pre_ping=True,
)

# High-performance optimizations for local SQLite database
if database_url.startswith("sqlite"):
    @event.listens_for(engine.sync_engine, "connect")
    def set_sqlite_optimizations(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA synchronous=NORMAL")
        cursor.execute("PRAGMA cache_size=-64000")
        cursor.execute("PRAGMA temp_store=MEMORY")
        cursor.close()

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency for yielding transactional database sessions."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db():
    """Initializes tables in database."""
    async with engine.begin() as conn:
        import app.models  # noqa
        await conn.run_sync(Base.metadata.create_all)
        from sqlalchemy import text
        try:
            await conn.execute(text("ALTER TABLE doctors ADD COLUMN doctor_voice VARCHAR(50) DEFAULT 'Deven (Male)'"))
        except Exception:
            pass
        try:
            await conn.execute(text("ALTER TABLE doctors ADD COLUMN patient_voice VARCHAR(50) DEFAULT 'Auto (Matches Gender)'"))
        except Exception:
            pass
    logger.info("Local SQLite database initialized with high-performance WAL mode.")
