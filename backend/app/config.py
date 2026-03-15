"""
Application Configuration

Only secrets (API keys) are read from .env / environment variables.
All non-sensitive defaults live in app/constants.py.
"""
from pydantic_settings import BaseSettings
from typing import List
from app.constants import (
    DEFAULT_MODEL, MAX_TOKENS, TEMPERATURE,
    CHROMA_PERSIST_DIR, EMBEDDING_MODEL, RAG_TOP_K, CHUNK_SIZE, CHUNK_OVERLAP,
    ALLOWED_ORIGINS, UPLOAD_DIR, MAX_UPLOAD_SIZE_MB,
)


class Settings(BaseSettings):
    # ── Secrets (loaded from .env) ─────────────────────────────────────────
    GROQ_API_KEY: str = ""          # https://console.groq.com/keys

    @property
    def active_provider(self) -> str:
        """Returns 'groq' when a key is configured, else 'demo'"""
        if self.GROQ_API_KEY and not self.GROQ_API_KEY.startswith("gsk_your"):
            return "groq"
        return "demo"

    # ── LLM (defaults from constants.py) ─────────────────────────────────
    DEFAULT_MODEL: str = DEFAULT_MODEL
    MAX_TOKENS: int    = MAX_TOKENS
    TEMPERATURE: float = TEMPERATURE

    # ── RAG (defaults from constants.py) ─────────────────────────────────
    CHROMA_PERSIST_DIR: str = CHROMA_PERSIST_DIR
    EMBEDDING_MODEL: str    = EMBEDDING_MODEL
    RAG_TOP_K: int          = RAG_TOP_K
    CHUNK_SIZE: int         = CHUNK_SIZE
    CHUNK_OVERLAP: int      = CHUNK_OVERLAP

    # ── Server (defaults from constants.py) ──────────────────────────────
    ALLOWED_ORIGINS: List[str] = ALLOWED_ORIGINS
    UPLOAD_DIR: str            = UPLOAD_DIR
    MAX_UPLOAD_SIZE_MB: int    = MAX_UPLOAD_SIZE_MB

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
