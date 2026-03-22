"""
Test Generation Router
POST /api/generate/tests          - Generate test cases from code/documentation
POST /api/generate/index          - Upload a file to the RAG vector store
GET  /api/generate/index/status   - Number of chunks currently indexed
DELETE /api/generate/index/{doc_id} - Remove a document from the vector store
GET  /api/generate/status/{job_id} - Get generation job status
GET  /api/generate/providers       - Get active provider + available models
"""

import os
import uuid
import time

from fastapi import APIRouter, HTTPException, BackgroundTasks, UploadFile, File, Form
from pydantic import BaseModel, Field
from typing import List, Optional

from app.services.generator import TestGeneratorService, PROVIDER_MODELS, DEFAULT_MODELS
from app.services.rag import RAGService
from app.config import settings

router = APIRouter()
generator_service = TestGeneratorService()
rag_service = RAGService()

# In-memory job store
jobs: dict = {}


class GenerateRequest(BaseModel):
    code: str = Field(..., description="Source code or documentation to generate tests for")
    input_type: str = Field(default="code", description="'code' or 'docs'")
    language: str = Field(default="Python", description="Programming language")
    framework: str = Field(default="pytest", description="Test framework")
    test_types: List[str] = Field(
        default=["unit", "edge"],
        description="Types: unit, integration, edge, parametrized"
    )
    model: str = Field(default="llama-3.3-70b-versatile", description="LLM model to use")
    use_rag: bool = Field(default=True, description="Whether to use RAG context retrieval")
    max_tests: int = Field(default=10, ge=1, le=50)


class GenerateResponse(BaseModel):
    job_id: str
    status: str
    code: Optional[str] = None
    stats: Optional[dict] = None
    context_used: Optional[List[str]] = None
    tokens_used: Optional[int] = None
    error: Optional[str] = None


async def _run_generation(job_id: str, req: GenerateRequest):
    """Background task for test generation"""
    try:
        jobs[job_id]["status"] = "running"

        # Step 1: Retrieve RAG context if enabled
        context_docs = []
        context_names = []
        if req.use_rag:
            results = rag_service.search(req.code, k=settings.RAG_TOP_K)
            context_docs = [r["content"] for r in results]
            context_names = [r["source"] for r in results]

        # Step 2: Generate tests
        result = await generator_service.generate(
            code=req.code,
            input_type=req.input_type,
            language=req.language,
            framework=req.framework,
            test_types=req.test_types,
            model=req.model,
            context_docs=context_docs,
        )

        jobs[job_id].update({
            "status": "completed",
            "code": result["tests"],
            "stats": result["stats"],
            "context_used": context_names,
            "tokens_used": result.get("tokens", 0),
        })

    except Exception as e:
        jobs[job_id].update({"status": "failed", "error": str(e)})


@router.post("/tests", response_model=GenerateResponse)
async def generate_tests(req: GenerateRequest, background_tasks: BackgroundTasks):
    """
    Generate test cases for the provided code or documentation.
    
    The request is processed asynchronously. Poll /status/{job_id} for results.
    For small requests, results are returned immediately.
    """
    if not req.code.strip() and not req.use_rag:
        raise HTTPException(status_code=400, detail="Provide code or enable RAG with indexed documents")
    if not req.test_types:
        raise HTTPException(status_code=400, detail="At least one test type must be selected")

    job_id = str(uuid.uuid4())
    jobs[job_id] = {"status": "queued", "created_at": time.time()}

    # For demo: run synchronously for small inputs
    if len(req.code) < 5000:
        await _run_generation(job_id, req)
    else:
        background_tasks.add_task(_run_generation, job_id, req)

    job = jobs[job_id]
    return GenerateResponse(
        job_id=job_id,
        status=job["status"],
        code=job.get("code"),
        stats=job.get("stats"),
        context_used=job.get("context_used"),
        tokens_used=job.get("tokens_used"),
        error=job.get("error"),
    )


@router.get("/status/{job_id}", response_model=GenerateResponse)
async def get_status(job_id: str):
    """Get the status of a generation job"""
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    
    job = jobs[job_id]
    return GenerateResponse(
        job_id=job_id,
        status=job["status"],
        code=job.get("code"),
        stats=job.get("stats"),
        context_used=job.get("context_used"),
        tokens_used=job.get("tokens_used"),
        error=job.get("error"),
    )


# ── RAG Indexing Endpoints ───────────────────────────────────────────────────

@router.post("/index")
async def index_file(
    file: UploadFile = File(...),
    doc_id: Optional[str] = Form(default=None),
):
    """
    Upload a source code or documentation file to the RAG vector store.
    Supported: .py .js .ts .txt .md .pdf
    """
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    doc_id = doc_id or str(uuid.uuid4())
    dest = os.path.join(settings.UPLOAD_DIR, f"{doc_id}_{file.filename}")
    try:
        contents = await file.read()
        with open(dest, "wb") as f:
            f.write(contents)
        chunks = rag_service.index_file(dest, file.filename, doc_id)
        return {
            "doc_id": doc_id,
            "filename": file.filename,
            "chunks_indexed": chunks,
            "total_chunks": rag_service.collection_count(),
        }
    finally:
        # Remove temp file after indexing
        if os.path.exists(dest):
            os.remove(dest)


@router.get("/index/status")
async def index_status():
    """Return the total number of chunks currently stored in the vector store."""
    return {"total_chunks": rag_service.collection_count()}


@router.delete("/index/{doc_id}")
async def delete_indexed_doc(doc_id: str):
    """Remove all chunks for a document from the vector store."""
    rag_service.delete_document(doc_id)
    return {"deleted": doc_id, "total_chunks": rag_service.collection_count()}


@router.get("/providers")
async def get_providers():
    """
    Returns the active provider (based on GROQ_API_KEY in .env)
    and all available Groq models.
    """
    provider = settings.active_provider
    return {
        "active_provider": provider,
        "active_model": DEFAULT_MODELS.get(provider, DEFAULT_MODELS["groq"]),
        "providers": {
            "groq": {
                "configured": provider == "groq",
                "models": PROVIDER_MODELS["groq"],
                "key_hint": "GROQ_API_KEY = gsk_...",
                "url": "https://console.groq.com/keys",
            },
        },
    }
