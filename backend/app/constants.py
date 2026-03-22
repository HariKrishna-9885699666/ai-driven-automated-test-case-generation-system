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
CHROMA_PERSIST_DIR = "./chroma_db"          # ChromaDB storage folder
EMBEDDING_MODEL    = "all-MiniLM-L6-v2"    # fast local sentence-transformer model
RAG_TOP_K          = 4                      # chunks retrieved per query
CHUNK_SIZE         = 512                    # chars per chunk
CHUNK_OVERLAP      = 100                    # overlap between consecutive chunks
UPLOAD_DIR         = "./uploads"            # temp folder for uploaded files

# ── Server ────────────────────────────────────────────────────────────────────
ALLOWED_ORIGINS = ["http://localhost:3000", "http://localhost:5173", "https://ai-driven-automated-test-case-generator.vercel.app"]
