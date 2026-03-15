"""
Non-sensitive application constants.
Sensitive secrets (API keys) stay in .env / environment variables only.
"""

# ── LLM ───────────────────────────────────────────────────────────────────────
DEFAULT_MODEL    = "llama-3.3-70b-versatile"
MAX_TOKENS       = 4096
TEMPERATURE      = 0.2

GROQ_MODELS = [
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant",
    "llama3-70b-8192",
    "mixtral-8x7b-32768",
    "gemma2-9b-it",
]

# ── RAG / Vector Store ────────────────────────────────────────────────────────
CHROMA_PERSIST_DIR = "./chroma_db"
EMBEDDING_MODEL    = "text-embedding-3-small"
RAG_TOP_K          = 4
CHUNK_SIZE         = 512
CHUNK_OVERLAP      = 128

# ── Server ────────────────────────────────────────────────────────────────────
ALLOWED_ORIGINS    = ["http://localhost:3000", "http://localhost:5173"]
UPLOAD_DIR         = "./uploads"
MAX_UPLOAD_SIZE_MB = 50
