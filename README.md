# AI-Driven Automated Test Case Generation System

Paste Python or JavaScript code -> get unit tests instantly, powered by **Groq LLM + RAG**.

---

## Architecture

```
+------------------------------------------+
|      FRONTEND  (React 19 + Vite)         |
|           Generate.jsx                   |
+--------------------+---------------------+
                     | REST  /api/*
+--------------------v---------------------+
|      BACKEND  (FastAPI + Python)         |
|                                          |
|  routers/generate.py                     |
|    POST /api/generate/tests              |
|    GET  /api/generate/providers          |
|                                          |
|  services/generator.py  <-- Groq LLM    |
|  services/rag.py        <-- ChromaDB     |
+------------------------------------------+
```

---

## Project Structure

```
ai-driven-automated-test-case-generation-system/
|
+-- frontend/
|   +-- src/
|   |   +-- components/
|   |   |   +-- Layout/
|   |   |   |   +-- Layout.jsx       <- App shell (sidebar + header + main)
|   |   |   |   +-- Sidebar.jsx      <- Navigation sidebar
|   |   |   |   +-- Header.jsx       <- Top header
|   |   |   +-- common/
|   |   |       +-- Card.jsx         <- Glass-morphism card
|   |   |       +-- Button.jsx       <- Reusable button
|   |   +-- pages/
|   |   |   +-- Generate.jsx         <- Main (and only) page
|   |   +-- services/
|   |   |   +-- api.js               <- Axios client (generateTests, getProviders)
|   |   +-- utils/
|   |   |   +-- constants.js         <- LANGUAGES, FRAMEWORK_FOR, DEFAULT_MODEL, ...
|   |   |   +-- funcUtils.js         <- parseError, copyToClipboard, downloadFile, stripCodeFences
|   |   +-- App.jsx                  <- Router (all routes -> /generate)
|   |   +-- main.jsx
|   |   +-- index.css
|   +-- public/
|   |   +-- favicon.svg
|   +-- package.json
|   +-- vite.config.js
|   +-- tailwind.config.js
|
+-- backend/
|   +-- main.py                      <- FastAPI entry point
|   +-- requirements-core.txt        <- Minimal dependency list
|   +-- .env                         <- GROQ_API_KEY only (git-ignored)
|   +-- app/
|       +-- config.py                <- Pydantic Settings (reads .env for secrets)
|       +-- constants.py             <- Non-secret defaults (model, RAG params, ...)
|       +-- routers/
|       |   +-- generate.py          <- POST /tests . GET /providers
|       +-- services/
|           +-- generator.py         <- Groq LLM via langchain-groq
|           +-- rag.py               <- ChromaDB vector store + retrieval
|
+-- README.md
```

---

## Quick Start

### Prerequisites

| Tool    | Version |
|---------|---------|
| Node.js | >= 20   |
| Yarn    | >= 4    |
| Python  | >= 3.10 |

---

### 1 - Backend setup

```bash
cd backend

# Create & activate virtual environment
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS / Linux

# Install dependencies
pip install -r requirements-core.txt

# Add your Groq API key  ->  https://console.groq.com/keys
# Edit .env and set:
# GROQ_API_KEY=gsk_...
```

### 2 - Start the backend

```bash
uvicorn main:app --reload --port 8000
```

API explorer: **http://localhost:8000/api/docs**

---

### 3 - Frontend setup

```bash
cd frontend
yarn install
```

### 4 - Start the frontend

```bash
yarn dev
```

App: **http://localhost:3000**

---

## Environment Variables

`backend/.env` holds **secrets only**. All other config lives in `backend/app/constants.py`.

```env
# backend/.env
GROQ_API_KEY=gsk_...
```

Override a constant via environment if needed (optional):

```env
DEFAULT_MODEL=llama-3.1-8b-instant
MAX_TOKENS=2048
```

> **No key yet?** The backend falls back to demo mode and returns sample output so the UI is still explorable.

---

## API Endpoints

| Method | Endpoint                    | Description                        |
|--------|-----------------------------|------------------------------------|
| POST   | /api/generate/tests         | Generate unit tests for given code |
| GET    | /api/generate/providers     | Active provider + available models |
| GET    | /api/health                 | Health check                       |

### POST /api/generate/tests - request body

```json
{
  "code": "def add(a, b): return a + b",
  "language": "Python",
  "framework": "pytest",
  "model": "llama-3.3-70b-versatile",
  "use_rag": true,
  "max_tests": 15
}
```

---

## Tech Stack

### Frontend

| Package                  | Purpose              |
|--------------------------|----------------------|
| React 19 + Vite 6        | UI framework + build |
| TailwindCSS 3            | Styling              |
| React Router 7           | Routing              |
| Axios                    | HTTP client          |
| React Syntax Highlighter | Code output display  |
| Lucide React             | Icons                |
| React Hot Toast          | Notifications        |

### Backend

| Package           | Purpose               |
|-------------------|-----------------------|
| FastAPI + Uvicorn | REST API              |
| langchain-groq    | Groq LLM integration  |
| LangChain Core    | LLM message types     |
| ChromaDB          | Vector store for RAG  |
| Pydantic Settings | Config + .env loading |

### Available Groq Models (free tier)

| Model                       | Speed   | Context |
|-----------------------------|---------|---------|
| llama-3.3-70b-versatile (default) | Fast | 128k  |
| llama-3.1-8b-instant        | Fastest | 128k   |
| llama3-70b-8192             | Fast    | 8k     |
| mixtral-8x7b-32768          | Fast    | 32k    |
| gemma2-9b-it                | Fast    | 8k     |

---

## License

MIT - free to use, modify, and distribute.
