"""
RAG (Retrieval-Augmented Generation) Service
Handles document indexing and semantic search using ChromaDB + LangChain
"""
import os
from typing import List, Dict, Any, Optional

from app.config import settings


class RAGService:
    """
    Manages the vector store for code and documentation retrieval.
    
    Pipeline:
    1. Parse uploaded file (code/docs/PDF)
    2. Split into chunks with overlap
    3. Generate embeddings (OpenAI / sentence-transformers)
    4. Store in ChromaDB
    5. On query: embed query → similarity search → return top-k chunks
    """

    def __init__(self):
        self._vectorstore = None
        self._embeddings = None
        self._initialized = False

    def _try_init(self):
        """Lazy initialization of vector store"""
        if self._initialized:
            return
        try:
            from langchain_openai import OpenAIEmbeddings
            from langchain_chroma import Chroma

            os.makedirs(settings.CHROMA_PERSIST_DIR, exist_ok=True)
            self._embeddings = OpenAIEmbeddings(
                model=settings.EMBEDDING_MODEL,
                api_key=settings.OPENAI_API_KEY or "demo",
            )
            self._vectorstore = Chroma(
                persist_directory=settings.CHROMA_PERSIST_DIR,
                embedding_function=self._embeddings,
                collection_name="test_gen_docs",
            )
            self._initialized = True
        except Exception:
            # Fallback: no vector store (demo mode)
            self._initialized = False

    async def index_document(self, file_path: str, doc_id: str, original_name: str) -> int:
        """
        Parse, chunk, embed, and store a document.
        
        Returns number of chunks created.
        """
        self._try_init()
        docs = self._load_document(file_path, original_name)
        if not docs:
            return 0

        try:
            from langchain.text_splitter import RecursiveCharacterTextSplitter

            splitter = RecursiveCharacterTextSplitter(
                chunk_size=settings.CHUNK_SIZE,
                chunk_overlap=settings.CHUNK_OVERLAP,
                separators=["\n\n", "\n", "def ", "class ", " ", ""],
            )
            chunks = splitter.split_documents(docs)

            # Add metadata
            for chunk in chunks:
                chunk.metadata["doc_id"] = doc_id
                chunk.metadata["source"] = original_name

            if self._vectorstore and chunks:
                self._vectorstore.add_documents(chunks)

            return len(chunks)
        except Exception:
            return max(1, len(docs) * 5)  # Estimate in demo mode

    def _load_document(self, file_path: str, name: str) -> list:
        """Load and parse a document based on its extension"""
        ext = os.path.splitext(name)[1].lower()
        try:
            if ext == '.pdf':
                from langchain_community.document_loaders import PyPDFLoader
                loader = PyPDFLoader(file_path)
                return loader.load()
            elif ext in {'.py', '.js', '.ts', '.java', '.go', '.rs', '.cs'}:
                from langchain_community.document_loaders import TextLoader
                loader = TextLoader(file_path, encoding='utf-8')
                return loader.load()
            elif ext in {'.md', '.txt', '.rst'}:
                from langchain_community.document_loaders import TextLoader
                loader = TextLoader(file_path, encoding='utf-8')
                return loader.load()
            elif ext == '.json':
                from langchain_community.document_loaders import JSONLoader
                loader = JSONLoader(file_path=file_path, jq_schema='.', text_content=False)
                return loader.load()
            else:
                from langchain_community.document_loaders import TextLoader
                loader = TextLoader(file_path, encoding='utf-8', autodetect_encoding=True)
                return loader.load()
        except Exception:
            # Read raw text as fallback
            try:
                with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                from langchain.docstore.document import Document
                return [Document(page_content=content, metadata={"source": name})]
            except Exception:
                return []

    async def search(self, query: str, k: int = 4) -> List[Dict[str, Any]]:
        """
        Perform semantic similarity search.
        
        Returns list of {content, source, score} dicts.
        """
        self._try_init()
        
        if not self._vectorstore:
            return self._demo_search_results(query)

        try:
            results = self._vectorstore.similarity_search_with_relevance_scores(
                query, k=k
            )
            return [
                {
                    "content": doc.page_content,
                    "source": doc.metadata.get("source", "unknown"),
                    "score": float(score),
                }
                for doc, score in results
            ]
        except Exception:
            return self._demo_search_results(query)

    async def delete_document(self, doc_id: str):
        """Remove all chunks for a document from the vector store"""
        if not self._vectorstore:
            return
        try:
            self._vectorstore._collection.delete(where={"doc_id": doc_id})
        except Exception:
            pass

    def _demo_search_results(self, query: str) -> List[Dict[str, Any]]:
        """Return mock search results when vector store is unavailable"""
        return [
            {
                "content": f"# Relevant code context for: {query}\ndef example_function():\n    pass",
                "source": "example.py",
                "score": 0.87,
            },
            {
                "content": f"## Documentation\nThis module handles {query.lower()} operations.",
                "source": "docs.md",
                "score": 0.72,
            },
        ]
