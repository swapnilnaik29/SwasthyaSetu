import os
from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Application
    APP_ENV: str = "development"
    APP_NAME: str = "SwasthyaSetu"
    DEBUG: bool = True
    API_V1_PREFIX: str = "/api/v1"
    SECRET_KEY: str = "swasthyasetu-super-secret-key-32-chars-long-demo"
    CORS_ORIGINS: Union[str, List[str]] = "*"

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            if v == "*":
                return ["*"]
            return [i.strip() for i in v.split(",") if i.strip()]
        return v

    # Local SQLite Database (default for ultra-low latency & zero-setup)
    DATABASE_URL: str = "sqlite+aiosqlite:///./swasthyasetu.db"

    @property
    def sync_database_url(self) -> str:
        """Provide a synchronous database URL for Alembic migrations or sync operations."""
        url = self.DATABASE_URL
        if url.startswith("sqlite+aiosqlite://"):
            return url.replace("sqlite+aiosqlite://", "sqlite://")
        if url.startswith("postgresql+psycopg://"):
            return url.replace("postgresql+psycopg://", "postgresql+psycopg://")
        if url.startswith("postgresql://"):
            return url.replace("postgresql://", "postgresql+psycopg://")
        return url

    # Gnani Speech-to-Text & Text-to-Speech (Default voice -> MALE)
    GNANI_API_KEY: str = ""
    GNANI_STT_MODEL: str = "prisma-v2.5"
    GNANI_TTS_MODEL: str = "timbre-v2.5"
    GNANI_STT_MODE: str = "rest"
    GNANI_TTS_MODE: str = "rest"
    GNANI_DEFAULT_VOICE_HI: str = "hi_male_1"
    GNANI_DEFAULT_VOICE_MR: str = "mr_male_1"
    GNANI_DEFAULT_VOICE_EN: str = "en_male_1"

    # Legacy Gnani parameters if needed
    GNANI_LEGACY_TOKEN: str = ""
    GNANI_LEGACY_ACCESS_KEY: str = ""
    GNANI_LEGACY_CERT_PATH: str = ""

    # OpenAI GPT-6 Luna
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-6-luna"
    OPENAI_API_MODE: str = "responses"
    OPENAI_REASONING_EFFORT: str = "none"
    TRANSLATION_PROMPT_VERSION: str = "v1"
    TRANSLATION_CACHE_TTL_DAYS: int = 90
    TRANSLATION_CACHE_ENCRYPTION_KEY: str = "dGhpcy1pcy1hLTMyLWJ5dGUtZW5jcnlwdGlvbi1rZXk="
    TRANSLATION_CACHE_HMAC_KEY: str = "swasthyasetu-hmac-secret-salt-demo-2026"

    # Audio & Retention
    MAX_AUDIO_MB: int = 20
    AUDIO_TEMP_DIR: str = "./tmp/audio"
    RETAIN_AUDIO: bool = False
    AUDIO_RETENTION_HOURS: int = 0

    # Clinic Display Settings
    CLINIC_DISPLAY_NAME: str = "SwasthyaSetu Demo Clinic"
    CLINIC_CONTACT_NUMBER: str = "+919876543210"


settings = Settings()
