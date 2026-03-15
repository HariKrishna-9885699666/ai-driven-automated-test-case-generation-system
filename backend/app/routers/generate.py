"""
Test Generation Router
POST /api/generate/tests          - Generate test cases from code/documentation
GET  /api/generate/status/{job_id} - Get generation job status
GET  /api/generate/providers       - Get active provider + available models
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
import time

from app.services.generator import TestGeneratorService, PROVIDER_MODELS, DEFAULT_MODELS
from app.services.rag import RAGService
from app.config import settings

router = APIRouter()
generator_service = TestGeneratorService()
rag_service = RAGService()

# In-memory job store (use Redis in production)
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
    model: str = Field(default="gpt-4-turbo", description="LLM model to use")
    use_rag: bool = Field(default=True, description="Whether to use RAG context")
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
            results = await rag_service.search(req.code, k=4)
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
    if not req.code.strip():
        raise HTTPException(status_code=400, detail="Code/documentation cannot be empty")
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
