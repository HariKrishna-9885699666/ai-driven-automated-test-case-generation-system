"""
AI-Driven Automated Test Case Generation System
Main FastAPI Application Entry Point
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
import uvicorn

from app.routers import generate
from app.routers.generate import rag_service
from app.config import settings

app = FastAPI(
    title="AI Test Case Generator API",
    description="Automated test case generation using LLMs and RAG",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Routers
app.include_router(generate.router, prefix="/api/generate", tags=["Test Generation"])


@app.on_event("startup")
async def startup_event():
    """
    Eagerly initialise the RAG service (downloads sentence-transformers model
    and opens ChromaDB) at server boot so the first user request is not slow.
    """
    try:
        rag_service._try_init()
        print("RAG service initialised successfully")
    except Exception as e:
        print(f"RAG init skipped (non-fatal): {e}")


@app.get("/api/health")
async def health():
    return {"status": "ok", "version": "1.0.0"}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
