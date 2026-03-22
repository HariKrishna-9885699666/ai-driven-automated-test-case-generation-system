# AI-Driven Automated Test Case Generation System

> Automatically generate production-quality test suites from source code or documentation using **Groq LLM** and **RAG (Retrieval-Augmented Generation)** powered by ChromaDB and sentence-transformers.

[![Demo](https://img.shields.io/badge/Demo-Live%20Preview-blue?style=for-the-badge)](https://ai-driven-automated-test-case-generator.vercel.app/)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)](https://react.dev)

---

## Table of Contents

1. [What This Project Does](#1-what-this-project-does)
2. [How It Works -- Full Pipeline](#2-how-it-works----full-pipeline)
3. [Architecture Overview](#3-architecture-overview)
4. [Project Structure](#4-project-structure)
5. [Tech Stack](#5-tech-stack)
6. [Prerequisites](#6-prerequisites)
7. [Step-by-Step Setup](#7-step-by-step-setup)
   - [Step 1 -- Clone the Repository](#step-1----clone-the-repository)
   - [Step 2 -- Get a Groq API Key](#step-2----get-a-groq-api-key)
   - [Step 3 -- Set Up the Backend](#step-3----set-up-the-backend)
   - [Step 4 -- Configure Environment Variables](#step-4----configure-environment-variables)
   - [Step 5 -- Start the Backend Server](#step-5----start-the-backend-server)
   - [Step 6 -- Set Up and Start the Frontend](#step-6----set-up-and-start-the-frontend)
   - [Step 7 -- Use the Application](#step-7----use-the-application)
8. [RAG -- Knowledge Base Indexing](#8-rag----knowledge-base-indexing)
9. [API Reference](#9-api-reference)
10. [Available Groq Models](#10-available-groq-models)
11. [Configuration Reference](#11-configuration-reference)

---

## 1. What This Project Does

This system takes your **source code or documentation** as input and automatically produces a complete, framework-specific test suite using a large language model. It optionally enriches generation with **RAG**: related code or documentation you have previously indexed is retrieved from a local vector database and injected into the LLM prompt as context, resulting in more accurate and project-aware tests.

**Key capabilities:**

- Supports **Python** (pytest) and **JavaScript / TypeScript** (Jest) code input
- Generates **unit tests**, **integration tests**, **edge case tests**, and **parametrized tests**
- Optionally **uploads reference files** (`.py`, `.js`, `.ts`, `.txt`, `.md`, `.pdf`) into a local ChromaDB knowledge base for context-aware generation
- Runs **fully locally** except for the Groq LLM call -- no OpenAI key, no cloud embeddings needed
- Displays **generation stats** per run: test count, coverage estimate, mock usage, bug detection %
- Tracks **generation history** with charts in the Analytics page

---

## 2. How It Works -- Full Pipeline

```
+-------------------------------------------------------------------------+
|                        USER INPUT  (Frontend)                           |
|  - Paste source code or documentation into the editor                  |
|  - Select language, framework, test types, and model                   |
|  - (Optional) Upload reference files to the RAG knowledge base         |
+------------------------------------+------------------------------------+
                                     |
                                     |  POST /api/generate/tests
                                     v
+-------------------------------------------------------------------------+
|  STAGE 1 -- REQUEST VALIDATION  (routers/generate.py)                  |
|                                                                         |
|  - FastAPI validates the request body against GenerateRequest           |
|    (Pydantic model): code, language, framework, test_types, model,     |
|    use_rag, max_tests                                                   |
|  - Creates a background job and returns a job_id immediately            |
|  - Validation rule: code must be present UNLESS use_rag=true and       |
|    ChromaDB already has indexed chunks                                  |
+------------------------------------+------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
|  STAGE 2 -- RAG CONTEXT RETRIEVAL  (services/rag.py)                   |
|                                                                         |
|  If use_rag=true and ChromaDB has indexed chunks:                      |
|    1. The input code is used as the search query                       |
|    2. sentence-transformers (all-MiniLM-L6-v2) encodes the query       |
|       into a 384-dimensional dense vector                               |
|       >> runs fully locally, no API key needed <<                      |
|    3. ChromaDB performs cosine similarity search across all stored     |
|       chunks and returns the top-K (default: 4) most relevant results  |
|    4. Each result contains: chunk text, source filename, score         |
|                                                                         |
|  If RAG is disabled or no chunks exist: context_docs = []             |
+------------------------------------+------------------------------------+
                                     |  context_docs (list of text chunks)
                                     v
+-------------------------------------------------------------------------+
|  STAGE 3 -- PROMPT CONSTRUCTION & LLM CALL  (services/generator.py)   |
|                                                                         |
|  - TEST_GENERATION_TEMPLATE is filled with:                            |
|      * RAG context chunks (or empty string if none)                    |
|      * Source code / documentation from the user                       |
|      * Language, framework, test types, max_tests                      |
|  - Two messages are sent to ChatGroq.ainvoke():                        |
|      1. SystemMessage -- expert test engineer persona with principles  |
|      2. HumanMessage  -- the filled template above                     |
|  - Groq returns the raw generated test code as a string                |
|    (default model: llama-3.3-70b-versatile)                            |
+------------------------------------+------------------------------------+
                                     |  raw test code string
                                     v
+-------------------------------------------------------------------------+
|  STAGE 4 -- STATS ANALYSIS & RESPONSE  (services/generator.py)         |
|                                                                         |
|  - _compute_stats() scans the generated code line-by-line:             |
|      * Counts test functions: def test_ / it() / describe()            |
|      * Counts assert statements and expect() calls                     |
|      * Detects Mock / patch / jest.mock usage                          |
|      * Classifies tests as unit / integration / edge by name keywords  |
|      * Estimates coverage % and bug detection % from assertion density |
|  - Final response JSON:                                                 |
|      { job_id, status, code, stats, context_used, tokens_used }        |
+------------------------------------+------------------------------------+
                                     |  JSON
                                     v
+-------------------------------------------------------------------------+
|  FRONTEND DISPLAY  (pages/Generate.jsx)                                 |
|                                                                         |
|  - Polls GET /api/generate/status/{job_id} every second until done     |
|  - Renders syntax-highlighted test code (react-syntax-highlighter)     |
|  - Shows stats cards: total tests, coverage %, mock count,             |
|    bug detection %                                                      |
|  - Shows "Context used" badges listing which RAG source files          |
|    contributed context to this generation                               |
|  - Copy to clipboard / Download as file buttons                        |
|  - Saves result to localStorage -> visible in the Analytics page       |
+-------------------------------------------------------------------------+
```

---

## 3. Architecture Overview

```
+----------------------------------------------------+
|           FRONTEND  (React 19 + Vite)              |
|                                                    |
|   pages/Generate.jsx     pages/Analytics.jsx       |
|         |                       |                  |
|   services/api.js  (Axios HTTP client)             |
+-------------------+----------------+--------------+
                    |  REST  /api/*
                    v
+----------------------------------------------------+
|           BACKEND  (FastAPI + Python)              |
|                                                    |
|  main.py  -->  routers/generate.py                 |
|                    |                               |
|         +----------+-----------+                   |
|         v                      v                   |
|  services/generator.py  services/rag.py            |
|  (LangChain + Groq LLM) (ChromaDB +                |
|                          sentence-transformers)    |
|                               |                    |
|                 chroma_db/  (persisted on disk)    |
+-------------------+----------------------------+--+
                    |
                    v
         Groq API  (cloud -- LLM only)
         llama-3.3-70b-versatile
```

---

## 4. Project Structure

```
ai-driven-automated-test-case-generation-system/
|-- README.md
|-- backend/
|   |-- main.py                     # FastAPI app entry point, CORS, router mounting
|   |-- requirements.txt            # Python package dependencies
|   |-- .env                        # Your secrets (GROQ_API_KEY) -- git-ignored
|   `-- app/
|       |-- config.py               # Pydantic Settings: loads .env + applies defaults
|       |-- constants.py            # Non-secret defaults (model, RAG params, CORS)
|       |-- routers/
|       |   `-- generate.py         # All API endpoints (test generation + RAG index)
|       `-- services/
|           |-- generator.py        # Groq LLM test generation logic + stats
|           `-- rag.py              # ChromaDB + sentence-transformers RAG service
`-- frontend/
    |-- package.json                # Node.js dependencies and scripts
    |-- vite.config.js              # Vite config (proxies /api/* to localhost:8000)
    |-- tailwind.config.js          # Tailwind CSS configuration
    `-- src/
        |-- App.jsx                 # React Router setup
        |-- main.jsx                # React entry point
        |-- index.css               # Tailwind + custom glass-morphism styles
        |-- components/
        |   |-- Layout/
        |   |   |-- Layout.jsx      # App shell: sidebar + header + main outlet
        |   |   |-- Sidebar.jsx     # Navigation sidebar
        |   |   `-- Header.jsx      # Top header bar
        |   `-- common/
        |       |-- Card.jsx        # Glass-morphism card wrapper component
        |       `-- Button.jsx      # Reusable button component
        |-- pages/
        |   |-- Generate.jsx        # Main page: code input, RAG upload panel, output
        |   `-- Analytics.jsx       # History charts and per-run stats from localStorage
        |-- services/
        |   `-- api.js              # Axios client: generateTests, indexFile, etc.
        `-- utils/
            |-- constants.js        # LANGUAGES, FRAMEWORK_FOR, DEFAULT_MODEL
            `-- funcUtils.js        # parseError, copyToClipboard, downloadFile
```

---

## 5. Tech Stack

### Backend

| Package                   | Version  | Purpose                                              |
|---------------------------|----------|------------------------------------------------------|
| FastAPI                   | 0.115.12 | REST API framework                                   |
| Uvicorn                   | 0.34.0   | ASGI server                                          |
| Pydantic / pydantic-settings | 2.x   | Request validation and .env config loading           |
| langchain                 | 1.2.8    | LLM abstraction layer                                |
| langchain-groq            | 1.1.2    | Groq LLM integration (ChatGroq)                      |
| chromadb                  | 0.6.3    | Local persistent vector store                        |
| sentence-transformers     | 3.4.1    | Local text embeddings -- all-MiniLM-L6-v2 model      |
| pdfplumber                | 0.11.4   | PDF text extraction for RAG indexing                 |
| python-multipart          | 0.0.20   | File upload support for FastAPI endpoints            |

### Frontend

| Package                   | Version | Purpose                               |
|---------------------------|---------|---------------------------------------|
| React                     | 19      | UI framework                          |
| Vite                      | 8       | Build tool and dev server             |
| TailwindCSS               | 3       | Utility-first CSS styling             |
| React Router              | 7       | Client-side routing                   |
| Axios                     | 1.7     | HTTP client for API calls             |
| React Syntax Highlighter  | 15.6    | Syntax-highlighted code output panel  |
| Recharts                  | 2.13    | Charts in the Analytics page          |
| Lucide React              | 0.468   | Icon library                          |
| React Hot Toast           | 2.4     | Toast notifications                   |
| Framer Motion             | 11      | UI animations                         |
| @tanstack/react-query     | 5       | Server state management               |

---

## 6. Prerequisites

| Tool    | Minimum Version | Notes                                          |
|---------|-----------------|------------------------------------------------|
| Python  | 3.10+           | Required for the backend                       |
| Node.js | 20+             | Required for the frontend                      |
| Yarn    | 4.x             | Frontend package manager (`npm install -g yarn`) |
| Git     | any             | To clone the repository                        |

**Groq API key** -- free tier available at [console.groq.com/keys](https://console.groq.com/keys). No credit card required.

---

## 7. Step-by-Step Setup

### Step 1 -- Clone the Repository

```bash
git clone https://github.com/your-username/ai-driven-automated-test-case-generation-system.git
cd ai-driven-automated-test-case-generation-system
```

---

### Step 2 -- Get a Groq API Key

1. Go to [https://console.groq.com/keys](https://console.groq.com/keys)
2. Sign up for a **free** Groq account -- no credit card required
3. Click **"Create API Key"**
4. Give it a name (e.g. `test-gen-local`) and copy the generated key
5. The key starts with `gsk_...` -- keep it ready for Step 4

> Groq provides extremely fast inference for open-source models like LLaMA 3 and Mixtral at no cost on the free tier.

---

### Step 3 -- Set Up the Backend

```bash
# Navigate to the backend folder
cd backend

# Create a Python virtual environment
python -m venv venv

# Activate the virtual environment
# Windows:
venv\Scripts\activate
# macOS / Linux:
# source venv/bin/activate

# Install all Python dependencies
pip install -r requirements.txt
```

**What gets installed and why:**

| Package                 | Why it is needed                                                         |
|-------------------------|--------------------------------------------------------------------------|
| `fastapi` + `uvicorn`   | Web server that handles all HTTP requests from the frontend              |
| `langchain-groq`        | Connects to the Groq API to call LLaMA / Mixtral models                 |
| `chromadb`              | Local vector database that stores and queries embedded document chunks   |
| `sentence-transformers` | Converts text to vectors using `all-MiniLM-L6-v2` -- **no API key needed** |
| `pdfplumber`            | Extracts plain text from uploaded PDF files before indexing             |
| `python-multipart`      | Enables multipart file upload endpoints in FastAPI                       |
| `pydantic-settings`     | Reads your `.env` file and maps values to typed Python config fields     |

> **Note on sentence-transformers:** The embedding model (`all-MiniLM-L6-v2`, ~90 MB) is downloaded from HuggingFace automatically on first use and cached locally at `~/.cache/huggingface/`. After the initial download, no internet connection is required for embedding.

---

### Step 4 -- Configure Environment Variables

Create a `.env` file inside the `backend/` folder. This file is already listed in `.gitignore` so it will never be committed.

```bash
# Open your text editor and create backend/.env with this content:
```

```env
# backend/.env

# Required -- get your free key at https://console.groq.com/keys
GROQ_API_KEY=gsk_your_actual_key_here
```

**Optional overrides** -- these already have sensible defaults in `constants.py` but can be changed in `.env` if needed:

```env
# Use a smaller / faster model
DEFAULT_MODEL=llama-3.1-8b-instant

# Increase token budget for very large files
MAX_TOKENS=8192

# LLM creativity (0.0 = focused/deterministic, 1.0 = creative)
TEMPERATURE=0.2

# Number of RAG context chunks injected per generation (default: 4)
RAG_TOP_K=4

# Change ChromaDB storage location
CHROMA_PERSIST_DIR=./chroma_db
```

---

### Step 5 -- Start the Backend Server

Make sure your virtual environment is active, then run from the `backend/` directory:

```bash
uvicorn main:app --reload --port 8000
```

Expected output:

```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Application startup complete.
```

**Verify it is running:**

| URL                                    | Expected result                              |
|----------------------------------------|----------------------------------------------|
| http://localhost:8000/api/health       | `{"status":"ok","version":"1.0.0"}`          |
| http://localhost:8000/api/docs         | Swagger UI listing all available endpoints   |
| http://localhost:8000/api/redoc        | ReDoc API documentation                      |

> **Keep this terminal open.** The `--reload` flag restarts the server automatically whenever you save a backend file.

---

### Step 6 -- Set Up and Start the Frontend

Open a **new terminal** (keep the backend terminal running):

```bash
# Navigate to the frontend folder
cd frontend

# Install Node.js dependencies
yarn install

# Start the development server
yarn dev
```

Expected output:

```
  VITE v8.x.x  ready in ~500ms

  Local:   http://localhost:5173/
```

Open your browser and go to **http://localhost:5173**.

> **API proxy:** Vite is configured in `vite.config.js` to forward all `/api/*` requests to `http://localhost:8000`. You will not encounter CORS issues during local development.

---

### Step 7 -- Use the Application

#### 7a. Basic Test Generation (No RAG)

1. Open **http://localhost:5173** in your browser
2. You will land on the **Generate** page
3. Paste your source code into the large code editor on the left
4. Configure the options on the right panel:
   - **Language** -- Python or JavaScript / TypeScript
   - **Test Types** -- tick any combination of: Unit, Integration, Edge Cases, Parametrized
   - **Max Tests** -- drag the slider (range: 1 to 50, default: 10)
   - **RAG toggle** -- switch it **Off** if you have no indexed files yet
5. Click **Generate Tests**
6. The frontend submits the code to `POST /api/generate/tests` as a background job
7. It polls `GET /api/generate/status/{job_id}` every second until the job completes
8. The output panel shows:
   - Syntax-highlighted generated test code
   - Stats cards: total tests, coverage estimate, mock usage, bug detection %
9. Use **Copy** to copy the code or **Download** to save it as a `.py` / `.js` file

---

#### 7b. Context-Aware Generation with RAG

RAG lets you upload your existing codebase or documentation so the LLM receives relevant context during generation. This produces more accurate, project-aware tests.

**Indexing reference files:**

1. In the **RAG Knowledge Base** panel at the top of the Generate page, click **Upload File**
2. Select a file. Supported formats:

   | Extension | Type                    |
   |-----------|-------------------------|
   | `.py`     | Python source file      |
   | `.js`     | JavaScript source file  |
   | `.ts`     | TypeScript source file  |
   | `.txt`    | Plain text document     |
   | `.md`     | Markdown document       |
   | `.pdf`    | PDF document            |

3. When the file is uploaded, the backend:
   - Reads the file (uses pdfplumber for PDF, UTF-8 for all others)
   - Splits the text into overlapping 512-character chunks (100-char overlap)
   - Encodes each chunk into a 384-dim vector using `all-MiniLM-L6-v2` (runs locally)
   - Stores all chunk vectors in ChromaDB under a unique `doc_id`
4. The **chunk count** and **indexed docs list** in the UI update immediately
5. You can index multiple files -- they all accumulate in the same vector store
6. ChromaDB data persists to `backend/chroma_db/` -- **you do not need to re-upload files after a server restart**

**Generating tests with RAG context:**

1. Enable the **RAG toggle** (set to On)
2. Paste your code as usual (or leave the editor empty to generate tests purely from indexed docs)
3. Click **Generate Tests**
4. The backend retrieves the top-4 most relevant chunks from ChromaDB and injects them into the LLM prompt
5. The result panel shows a **"Context used"** section listing which source files contributed context

**Removing indexed files:**

- Click the **trash icon** next to any file in the indexed docs list
- That document's chunks are immediately deleted from ChromaDB

---

#### 7c. Analytics Page

- Click **Analytics** in the left sidebar
- Every successful generation is saved automatically to `localStorage`
- The page displays:
  - **Total tests generated** (cumulative across all runs)
  - **Language breakdown** (pie chart: Python vs JavaScript)
  - **Test type distribution** (bar chart: unit / integration / edge / parametrized)
  - **Coverage trend over time** (line chart)
  - **Per-run history table** with timestamps, model used, and stats

---

## 8. RAG -- Knowledge Base Indexing

The RAG pipeline is fully local -- no external embedding API is called.

### Indexing Flow

```
Uploaded file  (POST /api/generate/index)
       |
       v
_read_file()
  - .pdf  --> pdfplumber extracts text page by page
  - others --> read as plain UTF-8 text
       |
       v
_split_text()
  - Splits into 512-character chunks
  - 100-character overlap between consecutive chunks
  - Line-aware: never cuts in the middle of a line
       |
       v
SentenceTransformerEmbeddingFunction (all-MiniLM-L6-v2)
  - Encodes each chunk to a 384-dimensional dense vector
  - Runs on CPU, fully local, no internet required after first download
       |
       v
ChromaDB PersistentClient  (collection: "test_gen_docs")
  - Stores: vector, chunk text, doc_id, source filename
  - Persisted to disk at ./chroma_db/
```

### Query Flow (at generation time)

```
Input code string  (used as the search query)
       |
       v
SentenceTransformerEmbeddingFunction
  - Encodes query to 384-dim vector (local)
       |
       v
ChromaDB collection.query()
  - Cosine similarity search
  - Returns top-K results (default K=4)
       |
       v
context_docs  [ {content, source, score}, ... ]
       |
       v
Injected into LLM prompt under:
  "## Context from codebase (RAG retrieved):"
```

### Persistence and Reset

- Data is stored at `backend/chroma_db/` by default (change via `CHROMA_PERSIST_DIR` in `.env`)
- Survives backend restarts automatically
- To fully reset the knowledge base: stop the server, delete the `chroma_db/` folder, restart

---

## 9. API Reference

### Test Generation

#### `POST /api/generate/tests`

Submit a test generation job. Returns a `job_id` immediately; poll the status endpoint for the result.

**Request body:**

```json
{
  "code": "def add(a, b):\n    return a + b",
  "input_type": "code",
  "language": "Python",
  "framework": "pytest",
  "test_types": ["unit", "edge", "parametrized"],
  "model": "llama-3.3-70b-versatile",
  "use_rag": true,
  "max_tests": 15
}
```

| Field        | Type     | Default                     | Description                                 |
|--------------|----------|-----------------------------|---------------------------------------------|
| `code`       | string   | required                    | Source code or documentation to test        |
| `input_type` | string   | `"code"`                    | `"code"` or `"docs"`                        |
| `language`   | string   | `"Python"`                  | Target programming language                 |
| `framework`  | string   | `"pytest"`                  | Test framework (pytest, jest, etc.)         |
| `test_types` | string[] | `["unit", "edge"]`          | Test categories to generate                 |
| `model`      | string   | `"llama-3.3-70b-versatile"` | Groq model ID                               |
| `use_rag`    | bool     | `true`                      | Whether to retrieve RAG context             |
| `max_tests`  | int      | `10`                        | Max tests to generate (1-50)                |

**Response (queued):**

```json
{
  "job_id": "a1b2c3d4",
  "status": "queued"
}
```

---

#### `GET /api/generate/status/{job_id}`

Poll for job result.

**Response (completed):**

```json
{
  "job_id": "a1b2c3d4",
  "status": "completed",
  "code": "import pytest\n\ndef test_add_two_integers():\n    assert add(2, 3) == 5",
  "stats": {
    "total": 8,
    "unit": 5,
    "edge": 3,
    "integration": 0,
    "parametrized": 0,
    "asserts": 14,
    "mocks": 0,
    "coverage": "~80%",
    "bug_detection_pct": 68
  },
  "context_used": ["utils.py", "helpers.md"],
  "tokens_used": 1024
}
```

**Response (failed):**

```json
{
  "job_id": "a1b2c3d4",
  "status": "failed",
  "error": "Groq API error: invalid API key"
}
```

---

#### `GET /api/generate/providers`

Returns the active LLM provider and the list of available models.

**Response:**

```json
{
  "provider": "groq",
  "active_model": "llama-3.3-70b-versatile",
  "models": [
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant",
    "llama3-70b-8192",
    "mixtral-8x7b-32768",
    "gemma2-9b-it"
  ]
}
```

---

### RAG Knowledge Base

#### `POST /api/generate/index`

Upload a file and index its contents into ChromaDB.

**Request:** `multipart/form-data` with a field named `file`

**Supported file types:** `.py` `.js` `.ts` `.txt` `.md` `.pdf`

**Response:**

```json
{
  "doc_id": "utils_py_a1b2c3",
  "filename": "utils.py",
  "chunks_indexed": 12,
  "total_chunks": 47
}
```

---

#### `GET /api/generate/index/status`

Returns the total number of chunks currently in the vector store.

**Response:**

```json
{
  "total_chunks": 47
}
```

---

#### `DELETE /api/generate/index/{doc_id}`

Remove all chunks belonging to a document from ChromaDB.

**Response:**

```json
{
  "deleted": true,
  "doc_id": "utils_py_a1b2c3",
  "total_chunks": 35
}
```

---

### Health

#### `GET /api/health`

```json
{ "status": "ok", "version": "1.0.0" }
```

---

## 10. Available Groq Models

| Model ID                      | Best For                              | Context Window |
|-------------------------------|---------------------------------------|----------------|
| `llama-3.3-70b-versatile`     | Best overall quality (default)        | 128k tokens    |
| `llama-3.1-8b-instant`        | Fastest / lowest latency              | 128k tokens    |
| `llama3-70b-8192`             | High quality with longer context      | 8k tokens      |
| `mixtral-8x7b-32768`          | Excellent for code generation         | 32k tokens     |
| `gemma2-9b-it`                | Lightweight and fast                  | 8k tokens      |

All models are **free** on Groq's free tier. Select a model in the configuration panel on the Generate page, or set `DEFAULT_MODEL` in `backend/.env`.

---

## 11. Configuration Reference

All defaults are defined in `backend/app/constants.py`. Override any value by adding the corresponding line to `backend/.env`.

| Variable              | Default                   | Description                                           |
|-----------------------|---------------------------|-------------------------------------------------------|
| `GROQ_API_KEY`        | *(required)*              | Your Groq API key from console.groq.com/keys          |
| `DEFAULT_MODEL`       | `llama-3.3-70b-versatile` | LLM model used when not explicitly specified          |
| `MAX_TOKENS`          | `4096`                    | Maximum output tokens per generation                  |
| `TEMPERATURE`         | `0.2`                     | LLM sampling temperature (0 = deterministic)          |
| `CHROMA_PERSIST_DIR`  | `./chroma_db`             | Directory where ChromaDB data is stored on disk       |
| `EMBEDDING_MODEL`     | `all-MiniLM-L6-v2`        | sentence-transformers model used for embeddings       |
| `RAG_TOP_K`           | `4`                       | Number of context chunks retrieved per query          |
| `CHUNK_SIZE`          | `512`                     | Characters per text chunk when indexing               |
| `CHUNK_OVERLAP`       | `100`                     | Overlap between consecutive chunks (prevents cutoffs) |
| `UPLOAD_DIR`          | `./uploads`               | Temporary folder for uploaded files                   |
