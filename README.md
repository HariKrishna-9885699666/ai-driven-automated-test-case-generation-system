# AI-Driven Automated Test Case Generation System

> Automatically generate production-quality test suites from source code or documentation using **Groq LLM** + **RAG (Retrieval-Augmented Generation)** powered by ChromaDB and sentence-transformers.

[![Demo](https://img.shields.io/badge/Demo-Live%20Preview-blue?style=for-the-badge)](https://ai-driven-automated-test-case-generator.vercel.app/)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)](https://react.dev)

---

## Table of Contents

1. [What This Project Does](#what-this-project-does)
2. [How It Works â€” Full Pipeline](#how-it-works--full-pipeline)
3. [Architecture Overview](#architecture-overview)
4. [Project Structure](#project-structure)
5. [Tech Stack](#tech-stack)
6. [Prerequisites](#prerequisites)
7. [Step-by-Step Setup](#step-by-step-setup)
   - [Step 1 â€” Clone the Repository](#step-1--clone-the-repository)
   - [Step 2 â€” Get a Groq API Key](#step-2--get-a-groq-api-key)
   - [Step 3 â€” Set Up the Backend](#step-3--set-up-the-backend)
   - [Step 4 â€” Configure Environment Variables](#step-4--configure-environment-variables)
   - [Step 5 â€” Start the Backend Server](#step-5--start-the-backend-server)
   - [Step 6 â€” Set Up and Start the Frontend](#step-6--set-up-and-start-the-frontend)
   - [Step 7 â€” Use the Application](#step-7--use-the-application)
8. [RAG â€” Knowledge Base Indexing](#rag--knowledge-base-indexing)
9. [API Reference](#api-reference)
10. [Available Groq Models](#available-groq-models)
11. [Configuration Reference](#configuration-reference)

---

## What This Project Does

This system takes your **source code or documentation** as input and automatically produces a complete, framework-specific test suite using a large language model. It optionally enriches generation with **RAG**: related code or documentation you have previously indexed is retrieved from a local vector database and injected into the prompt as context, resulting in more accurate and project-aware tests.

**Key capabilities:**
- Supports **Python** (pytest) and **JavaScript/TypeScript** (Jest) code input
- Generates **unit tests**, **integration tests**, **edge case tests**, and **parametrized tests**
- Optionally **uploads files** (`.py`, `.js`, `.ts`, `.txt`, `.md`, `.pdf`) to a local ChromaDB knowledge base for context-aware generation
- Runs **fully locally** except for the Groq LLM call â€” no OpenAI key, no cloud embeddings
- Displays **stats** per generation: test count, coverage estimate, mock usage, bug detection %
- Tracks **generation history** in the Analytics page

---

## How It Works â€” Full Pipeline

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                        USER INPUT (Frontend)                            â”‚
â”‚  â€¢ Paste source code / documentation into the editor                    â”‚
â”‚  â€¢ Select language, framework, test types, model                        â”‚
â”‚  â€¢ (Optional) Upload reference files to RAG knowledge base              â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                             â”‚  POST /api/generate/tests
                             â–¼
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  STAGE 1 â€” REQUEST VALIDATION  (routers/generate.py)                    â”‚
â”‚  â€¢ FastAPI validates request against GenerateRequest Pydantic model     â”‚
â”‚  â€¢ Creates a background job, returns job_id immediately                 â”‚
â”‚  â€¢ Validation: code must be present unless RAG is enabled with chunks   â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                             â”‚
                             â–¼
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  STAGE 2 â€” RAG CONTEXT RETRIEVAL  (services/rag.py)                     â”‚
â”‚  â€¢ If use_rag=true and ChromaDB has indexed chunks:                     â”‚
â”‚    1. Input code is used as the search query                            â”‚
â”‚    2. sentence-transformers (all-MiniLM-L6-v2) encodes the query        â”‚
â”‚       into a dense vector â€” runs locally, no API key needed             â”‚
â”‚    3. ChromaDB performs cosine similarity search across stored chunks   â”‚
â”‚    4. Returns top-K (default 4) most relevant chunks                    â”‚
â”‚       with source filename + similarity score                           â”‚
â”‚  â€¢ If RAG is disabled or no chunks exist, context_docs = []            â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                             â”‚  context_docs (list of text chunks)
                             â–¼
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  STAGE 3 â€” PROMPT CONSTRUCTION & LLM CALL  (services/generator.py)      â”‚
â”‚  â€¢ TEST_GENERATION_TEMPLATE is filled with:                             â”‚
â”‚    - RAG context chunks (or empty if none)                              â”‚
â”‚    - Source code / documentation                                        â”‚
â”‚    - Language, framework, test types, max_tests                         â”‚
â”‚  â€¢ Two messages are sent to ChatGroq.ainvoke():                         â”‚
â”‚    1. SystemMessage â€” expert test engineer persona                      â”‚
â”‚    2. HumanMessage  â€” the filled template above                         â”‚
â”‚  â€¢ Groq streams back raw test code (llama-3.3-70b-versatile by default) â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                             â”‚  raw test code string
                             â–¼
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  STAGE 4 â€” STATS ANALYSIS & RESPONSE  (services/generator.py)           â”‚
â”‚  â€¢ _compute_stats() scans generated code line by line:                  â”‚
â”‚    - Counts test functions  (def test_ / it( / describe()               â”‚
â”‚    - Counts assert statements and expect() calls                        â”‚
â”‚    - Detects Mock / patch / jest.mock usage                             â”‚
â”‚    - Classifies tests as unit / integration / edge by name keywords     â”‚
â”‚    - Estimates coverage % and bug detection % from assertion density    â”‚
â”‚  â€¢ Final JSON response:                                                 â”‚
â”‚    { job_id, status, code, stats, context_used, tokens_used }          â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                             â”‚  JSON
                             â–¼
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  FRONTEND DISPLAY  (pages/Generate.jsx)                                 â”‚
â”‚  â€¢ Polls GET /api/generate/status/{job_id} until completed              â”‚
â”‚  â€¢ Renders syntax-highlighted test code                                 â”‚
â”‚  â€¢ Shows stats cards: test count, coverage %, mocks, bug detection      â”‚
â”‚  â€¢ Shows which RAG source files were used as context                    â”‚
â”‚  â€¢ Copy to clipboard / download as file                                 â”‚
â”‚  â€¢ Saves result to localStorage â†’ visible in Analytics page             â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

---

## Architecture Overview

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚             FRONTEND  (React 19 + Vite)               â”‚
â”‚                                                        â”‚
â”‚   pages/Generate.jsx     pages/Analytics.jsx           â”‚
â”‚        â”‚                        â”‚                      â”‚
â”‚   services/api.js (Axios)       â”‚                      â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜                      â”‚
               â”‚  REST  /api/*                            â”‚
               â–¼                                          â”‚
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”‚
â”‚             BACKEND  (FastAPI + Python)               â”‚ â”‚
â”‚                                                        â”‚ â”‚
â”‚  main.py  â”€â”€â–º  routers/generate.py                    â”‚ â”‚
â”‚                  â”‚                                     â”‚ â”‚
â”‚         â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”                         â”‚ â”‚
â”‚         â–¼                   â–¼                         â”‚ â”‚
â”‚  services/generator.py  services/rag.py               â”‚ â”‚
â”‚  (LangChain + Groq LLM) (ChromaDB + sentence-         â”‚ â”‚
â”‚                           transformers)               â”‚ â”‚
â”‚                               â”‚                       â”‚ â”‚
â”‚                      chroma_db/  (persisted locally)  â”‚ â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â”‚
               â”‚                                         â”‚
               â–¼                                         â”‚
      Groq API (cloud LLM)                               â”‚
      llama-3.3-70b-versatile                            â”‚
```

---

## Project Structure

```
ai-driven-automated-test-case-generation-system/
â”œâ”€â”€ README.md
â”œâ”€â”€ backend/
â”‚   â”œâ”€â”€ main.py                    # FastAPI app + CORS + router mounting
â”‚   â”œâ”€â”€ requirements.txt           # Python dependencies
â”‚   â”œâ”€â”€ .env                       # GROQ_API_KEY (you create this, git-ignored)
â”‚   â””â”€â”€ app/
â”‚       â”œâ”€â”€ config.py              # Pydantic Settings â€” loads .env secrets + defaults
â”‚       â”œâ”€â”€ constants.py           # Non-secret defaults (model, RAG params, CORS)
â”‚       â”œâ”€â”€ routers/
â”‚       â”‚   â””â”€â”€ generate.py        # All API endpoints
â”‚       â””â”€â”€ services/
â”‚           â”œâ”€â”€ generator.py       # Groq LLM test generation logic
â”‚           â””â”€â”€ rag.py             # ChromaDB + sentence-transformers RAG service
â””â”€â”€ frontend/
    â”œâ”€â”€ package.json               # Node deps + scripts
    â”œâ”€â”€ vite.config.js             # Vite config (proxy: /api â†’ localhost:8000)
    â”œâ”€â”€ tailwind.config.js
    â””â”€â”€ src/
        â”œâ”€â”€ App.jsx                # Router setup
        â”œâ”€â”€ main.jsx               # React entry point
        â”œâ”€â”€ index.css              # Tailwind + custom glass-morphism styles
        â”œâ”€â”€ components/
        â”‚   â”œâ”€â”€ Layout/
        â”‚   â”‚   â”œâ”€â”€ Layout.jsx     # App shell (sidebar + header + <Outlet>)
        â”‚   â”‚   â”œâ”€â”€ Sidebar.jsx    # Navigation sidebar
        â”‚   â”‚   â””â”€â”€ Header.jsx     # Top header bar
        â”‚   â””â”€â”€ common/
        â”‚       â”œâ”€â”€ Card.jsx       # Glass-morphism card wrapper
        â”‚       â””â”€â”€ Button.jsx     # Reusable button component
        â”œâ”€â”€ pages/
        â”‚   â”œâ”€â”€ Generate.jsx       # Main page: code input, RAG upload, output
        â”‚   â””â”€â”€ Analytics.jsx      # History + charts from localStorage
        â”œâ”€â”€ services/
        â”‚   â””â”€â”€ api.js             # Axios client for all backend calls
        â””â”€â”€ utils/
            â”œâ”€â”€ constants.js       # LANGUAGES, FRAMEWORK_FOR, DEFAULT_MODEL
            â””â”€â”€ funcUtils.js       # parseError, copyToClipboard, downloadFile
```

---

## Tech Stack

### Backend

| Package                 | Version   | Purpose                                         |
|-------------------------|-----------|-------------------------------------------------|
| FastAPI                 | 0.115.12  | REST API framework                              |
| Uvicorn                 | 0.34.0    | ASGI server                                     |
| Pydantic / pydantic-settings | 2.x  | Request validation + .env config loading        |
| langchain               | 1.2.8     | LLM abstraction layer                           |
| langchain-groq          | 1.1.2     | Groq LLM integration (ChatGroq)                 |
| chromadb                | 0.6.3     | Local persistent vector store                   |
| sentence-transformers   | 3.4.1     | Local text embeddings (all-MiniLM-L6-v2)        |
| pdfplumber              | 0.11.4    | PDF text extraction for RAG indexing            |
| python-multipart        | 0.0.20    | File upload support for FastAPI                 |

### Frontend

| Package                  | Version  | Purpose                              |
|--------------------------|----------|--------------------------------------|
| React                    | 19       | UI framework                         |
| Vite                     | 8        | Build tool + dev server              |
| TailwindCSS              | 3        | Utility-first styling                |
| React Router             | 7        | Client-side routing                  |
| Axios                    | 1.7      | HTTP client                          |
| React Syntax Highlighter | 15.6     | Syntax-highlighted code display      |
| Recharts                 | 2.13     | Charts in the Analytics page         |
| Lucide React             | 0.468    | Icon library                         |
| React Hot Toast          | 2.4      | Toast notifications                  |
| Framer Motion            | 11       | Animations                           |
| @tanstack/react-query    | 5        | Server state management              |

---

## Prerequisites

| Tool    | Minimum Version | Notes                                      |
|---------|-----------------|--------------------------------------------|
| Python  | 3.10+           | Required for backend                       |
| Node.js | 20+             | Required for frontend                      |
| Yarn    | 4.x             | Frontend package manager (`npm i -g yarn`) |
| Git     | any             | To clone the repo                          |

> **Groq API key** â€” free tier available at [console.groq.com/keys](https://console.groq.com/keys). No credit card required.

---

## Step-by-Step Setup

### Step 1 â€” Clone the Repository

```bash
git clone https://github.com/your-username/ai-driven-automated-test-case-generation-system.git
cd ai-driven-automated-test-case-generation-system
```

---

### Step 2 â€” Get a Groq API Key

1. Go to [https://console.groq.com/keys](https://console.groq.com/keys)
2. Sign up for a **free** Groq account (no credit card required)
3. Click **"Create API Key"**
4. Give it a name (e.g. `test-gen-local`) and copy the key â€” it starts with `gsk_...`
5. Keep this key ready for Step 4

> Groq provides extremely fast inference for open-source models like LLaMA 3 and Mixtral at no cost on the free tier.

---

### Step 3 â€” Set Up the Backend

```bash
# Navigate to the backend folder
cd backend

# Create a Python virtual environment
python -m venv venv

# Activate the virtual environment
# On Windows:
venv\Scripts\activate
# On macOS / Linux:
source venv/bin/activate

# Install all Python dependencies
pip install -r requirements.txt
```

**What this installs:**

| Package               | Why it's needed                                                         |
|-----------------------|-------------------------------------------------------------------------|
| `fastapi` + `uvicorn` | Web server â€” handles all HTTP requests from the frontend                |
| `langchain-groq`      | Connects to the Groq API to run LLaMA / Mixtral LLM inference          |
| `chromadb`            | Local vector database that stores embedded document chunks              |
| `sentence-transformers` | Converts text to vectors locally using `all-MiniLM-L6-v2` model â€” **no API key needed** |
| `pdfplumber`          | Extracts plain text from uploaded PDF files for RAG indexing            |
| `python-multipart`    | Enables file upload endpoints in FastAPI                                |
| `pydantic-settings`   | Reads your `.env` file and maps values to typed config fields           |

> **Note on sentence-transformers:** The embedding model (`all-MiniLM-L6-v2`) is automatically downloaded from HuggingFace on first run (~90 MB). After that it is cached locally. No API key or internet connection is required for embedding.

---

### Step 4 â€” Configure Environment Variables

Create a file named `.env` inside the `backend/` folder:

```bash
# On Windows (in the backend folder):
echo GROQ_API_KEY=gsk_your_actual_key_here > .env

# On macOS / Linux:
echo "GROQ_API_KEY=gsk_your_actual_key_here" > .env
```

Or create `backend/.env` manually with a text editor:

```env
# backend/.env

# Required â€” your Groq API key from https://console.groq.com/keys
GROQ_API_KEY=gsk_your_actual_key_here
```

**Optional overrides** â€” these values already have sensible defaults in `constants.py` but can be overridden in `.env`:

```env
# LLM settings
DEFAULT_MODEL=llama-3.3-70b-versatile
MAX_TOKENS=4096
TEMPERATURE=0.2

# RAG / vector store settings
CHROMA_PERSIST_DIR=./chroma_db       # where ChromaDB data is saved
EMBEDDING_MODEL=all-MiniLM-L6-v2     # sentence-transformers model name
RAG_TOP_K=4                          # number of chunks retrieved per query
CHUNK_SIZE=512                       # characters per chunk
CHUNK_OVERLAP=100                    # overlap between consecutive chunks
```

> **Security:** The `.env` file is listed in `.gitignore` and will never be committed. Never share your API key publicly.

---

### Step 5 â€” Start the Backend Server

Make sure your virtual environment is still activated, then:

```bash
# From the backend/ directory
uvicorn main:app --reload --port 8000
```

You should see output like:

```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Application startup complete.
```

**Verify the backend is running:**

| URL                                    | What you should see                        |
|----------------------------------------|--------------------------------------------|
| http://localhost:8000/api/health       | `{"status":"ok","version":"1.0.0"}`        |
| http://localhost:8000/api/docs         | Interactive Swagger UI (all endpoints)     |
| http://localhost:8000/api/redoc        | ReDoc API documentation                    |

> **Keep this terminal open.** The `--reload` flag automatically restarts the server when you edit backend files.

---

### Step 6 â€” Set Up and Start the Frontend

Open a **new terminal** (keep the backend terminal running):

```bash
# Navigate to the frontend folder
cd frontend

# Install Node.js dependencies
yarn install

# Start the development server
yarn dev
```

You should see:

```
  VITE v8.x.x  ready in 500ms

  âžœ  Local:   http://localhost:5173/
  âžœ  Network: use --host to expose
```

Open your browser and go to [http://localhost:5173](http://localhost:5173)

> **API proxy:** Vite is configured to forward all `/api/*` requests from the frontend to `http://localhost:8000`, so there are no CORS issues during development.

---

### Step 7 â€” Use the Application

#### Generating Tests (Basic)

1. Open [http://localhost:5173](http://localhost:5173) in your browser
2. You land on the **Generate** page
3. Paste your source code into the large text editor on the left
4. Use the configuration panel to set:
   - **Language** â€” Python or JavaScript/TypeScript
   - **Test Types** â€” check any combination of: Unit, Integration, Edge Cases, Parametrized
   - **Max Tests** â€” slider from 1 to 50 (default 10)
   - **RAG toggle** â€” On = use indexed knowledge base context; Off = generate from code only
5. Click **Generate Tests**
6. The request is sent to the backend as a background job
7. The frontend polls `/api/generate/status/{job_id}` every second until complete
8. Results appear on the right: syntax-highlighted test code + stats cards
9. Use **Copy** or **Download** to save the output

#### Using RAG â€” Indexing Reference Files

RAG allows you to upload your existing codebase or documentation so the LLM receives relevant context when generating tests. This produces more accurate, project-aware results.

1. In the **RAG Knowledge Base** panel on the Generate page, click **Upload File**
2. Select a file of one of the supported types:

   | Extension | Type                        |
   |-----------|-----------------------------|
   | `.py`     | Python source file          |
   | `.js`     | JavaScript source file      |
   | `.ts`     | TypeScript source file      |
   | `.txt`    | Plain text document         |
   | `.md`     | Markdown document           |
   | `.pdf`    | PDF document                |

3. The file is sent to `POST /api/generate/index`, where it is:
   - Read and split into overlapping chunks (512 chars, 100 char overlap)
   - Each chunk is encoded into a vector using `all-MiniLM-L6-v2` (runs locally)
   - Stored in ChromaDB under a unique `doc_id`
4. The **chunk count** and **indexed docs list** update immediately
5. You can index multiple files â€” they all accumulate in the same vector store
6. To remove a file, click the **trash icon** next to it in the indexed docs list
7. Enable the **RAG toggle** (On) before clicking Generate Tests â€” the backend will retrieve the top-4 most relevant chunks and inject them into the LLM prompt

> **Tip:** You can generate tests *without* pasting any code if you have RAG files indexed and the toggle is On. The LLM will use the indexed context as its primary source.

#### Viewing Analytics

- Click **Analytics** in the sidebar
- Every successful test generation is saved to `localStorage`
- The Analytics page shows: total tests generated, language breakdown (pie chart), test type distribution (bar chart), coverage trends (line chart), and per-run history table

---

## RAG â€” Knowledge Base Indexing

The RAG pipeline is designed to be **fully local** â€” no external embedding API is needed.

### Indexing Flow

```
Uploaded file
     â”‚
     â–¼
_read_file()          â† extracts plain text (pdfplumber for PDF, utf-8 for others)
     â”‚
     â–¼
_split_text()         â† splits into 512-char chunks with 100-char overlap
     â”‚
     â–¼
SentenceTransformer   â† encodes each chunk to a dense vector (all-MiniLM-L6-v2, local)
     â”‚
     â–¼
ChromaDB collection   â† stores (vector, text, metadata) â€” persisted to ./chroma_db/
```

### Query Flow (at generation time)

```
Input code (used as query)
     â”‚
     â–¼
SentenceTransformer   â† encode query to vector
     â”‚
     â–¼
ChromaDB.query()      â† cosine similarity search, returns top-K chunks
     â”‚
     â–¼
Injected into prompt  â† "## Context from codebase (RAG retrieved): ..."
```

### ChromaDB Persistence

- The vector store is saved to `backend/chroma_db/` by default
- Data **persists across server restarts** â€” you do not need to re-upload files each time
- To completely reset the knowledge base, delete the `chroma_db/` folder and restart the backend

---

## API Reference

### Test Generation

#### `POST /api/generate/tests`
Submits a test generation job. Returns immediately with a `job_id`.

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

| Field        | Type     | Default                     | Description                            |
|--------------|----------|-----------------------------|----------------------------------------|
| `code`       | string   | â€”                           | Source code or documentation           |
| `input_type` | string   | `"code"`                    | `"code"` or `"docs"`                   |
| `language`   | string   | `"Python"`                  | Programming language                   |
| `framework`  | string   | `"pytest"`                  | Test framework                         |
| `test_types` | string[] | `["unit", "edge"]`          | Test categories to generate            |
| `model`      | string   | `"llama-3.3-70b-versatile"` | Groq model ID                          |
| `use_rag`    | bool     | `true`                      | Whether to retrieve RAG context        |
| `max_tests`  | int      | `10`                        | Maximum number of tests (1â€“50)         |

**Response:**
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
  "code": "import pytest\n\ndef test_add_two_integers():\n    ...",
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

---

#### `GET /api/generate/providers`
Returns the active LLM provider and available model list.

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
Upload a file and index it into ChromaDB.

**Request:** `multipart/form-data` with field `file`  
**Supported types:** `.py` `.js` `.ts` `.txt` `.md` `.pdf`

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
Returns total number of chunks currently stored.

**Response:**
```json
{
  "total_chunks": 47
}
```

---

#### `DELETE /api/generate/index/{doc_id}`
Remove all chunks associated with a document from ChromaDB.

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

## Available Groq Models

| Model ID                      | Best For                           | Context Window |
|-------------------------------|------------------------------------|----------------|
| `llama-3.3-70b-versatile`     | Best quality (default)             | 128k tokens    |
| `llama-3.1-8b-instant`        | Fastest responses / low latency    | 128k tokens    |
| `llama3-70b-8192`             | High quality, longer context       | 8k tokens      |
| `mixtral-8x7b-32768`          | Excellent for code generation      | 32k tokens     |
| `gemma2-9b-it`                | Lightweight, fast                  | 8k tokens      |

All models are **free** on Groq's free tier.

---

## Configuration Reference

All defaults live in `backend/app/constants.py`. Override any value in `backend/.env`.

| Variable            | Default                        | Description                               |
|---------------------|--------------------------------|-------------------------------------------|
| `GROQ_API_KEY`      | *(required)*                   | Your Groq API key                         |
| `DEFAULT_MODEL`     | `llama-3.3-70b-versatile`      | LLM model used when not specified         |
| `MAX_TOKENS`        | `4096`                         | Max output tokens per generation          |
| `TEMPERATURE`       | `0.2`                          | LLM sampling temperature (0 = focused)   |
| `CHROMA_PERSIST_DIR`| `./chroma_db`                  | Path where ChromaDB data is stored        |
| `EMBEDDING_MODEL`   | `all-MiniLM-L6-v2`             | sentence-transformers model for embeddings|
| `RAG_TOP_K`         | `4`                            | Number of chunks retrieved per query      |
| `CHUNK_SIZE`        | `512`                          | Characters per text chunk                 |
| `CHUNK_OVERLAP`     | `100`                          | Overlap between consecutive chunks        |
| `UPLOAD_DIR`        | `./uploads`                    | Temp folder for uploaded files            |
