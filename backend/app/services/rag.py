"""
RAG (Retrieval-Augmented Generation) Service

Pipeline:
  Index:  file → chunk → embed (sentence-transformers, local, no API key) → ChromaDB
  Query:  input code → embed → similarity search → top-k context chunks → Groq prompt
"""
import os
from typing import List, Dict, Any

from app.config import settings


class RAGService:
    """
    Manages a local ChromaDB vector store using sentence-transformers embeddings.
    No external API key required — embeddings run fully locally.
    """

    def __init__(self):
        self._vectorstore = None
        self._embedding_fn = None
        self._initialized = False

    def _try_init(self):
        """Lazy initialization. Called on first index or search."""
        if self._initialized:
            return
        try:
            import chromadb
            from chromadb.utils.embedding_functions import SentenceTransformerEmbeddingFunction

            os.makedirs(settings.CHROMA_PERSIST_DIR, exist_ok=True)
            client = chromadb.PersistentClient(path=settings.CHROMA_PERSIST_DIR)
            self._embedding_fn = SentenceTransformerEmbeddingFunction(
                model_name=settings.EMBEDDING_MODEL
            )
            self._collection = client.get_or_create_collection(
                name="test_gen_docs",
                embedding_function=self._embedding_fn,
            )
            self._initialized = True
        except Exception as e:
            self._initialized = False
            raise RuntimeError(
                f"RAG init failed — is chromadb + sentence-transformers installed? ({e})"
            )

    # ──────────────────────────────────────────────────────────────────────────
    # Indexing
    # ──────────────────────────────────────────────────────────────────────────

    def index_text(self, text: str, source_name: str, doc_id: str) -> int:
        """
        Chunk a raw text string, embed each chunk, and store in ChromaDB.
        Returns the number of chunks indexed.
        """
        self._try_init()
        chunks = self._split_text(text)
        if not chunks:
            return 0

        ids = [f"{doc_id}_{i}" for i in range(len(chunks))]
        metadatas = [{"source": source_name, "doc_id": doc_id} for _ in chunks]

        # Delete existing chunks for this doc_id before re-indexing
        try:
            self._collection.delete(where={"doc_id": doc_id})
        except Exception:
            pass

        self._collection.add(documents=chunks, ids=ids, metadatas=metadatas)
        return len(chunks)

    def index_file(self, file_path: str, original_name: str, doc_id: str) -> int:
        """
        Read a file from disk, extract text, and index it.
        Supports .py, .js, .ts, .java, .go, .rs, .cs, .md, .txt, .rst, .json, .pdf
        """
        self._try_init()
        text = self._read_file(file_path, original_name)
        if not text:
            return 0
        return self.index_text(text, original_name, doc_id)

    # ──────────────────────────────────────────────────────────────────────────
    # Search
    # ──────────────────────────────────────────────────────────────────────────

    def search(self, query: str, k: int = 4) -> List[Dict[str, Any]]:
        """
        Embed the query and return the top-k most similar chunks.
        Returns list of {content, source, score} dicts.
        Returns [] if the vector store is empty or not initialized.
        """
        try:
            self._try_init()
        except RuntimeError:
            return []

        if not self._initialized:
            return []

        count = self._collection.count()
        if count == 0:
            return []

        results = self._collection.query(
            query_texts=[query],
            n_results=min(k, count),
            include=["documents", "metadatas", "distances"],
        )

        docs = results["documents"][0]
        metas = results["metadatas"][0]
        distances = results["distances"][0]

        return [
            {
                "content": doc,
                "source": meta.get("source", "unknown"),
                "score": round(1 - dist, 4),   # cosine distance → similarity
            }
            for doc, meta, dist in zip(docs, metas, distances)
        ]

    def delete_document(self, doc_id: str):
        """Remove all chunks for a given doc_id from the vector store."""
        try:
            self._try_init()
            self._collection.delete(where={"doc_id": doc_id})
        except Exception:
            pass

    def collection_count(self) -> int:
        """Return the total number of chunks stored."""
        try:
            self._try_init()
            return self._collection.count()
        except Exception:
            return 0

    # ──────────────────────────────────────────────────────────────────────────
    # Helpers
    # ──────────────────────────────────────────────────────────────────────────

    def _split_text(self, text: str) -> List[str]:
        """Split text into overlapping chunks."""
        chunk_size = settings.CHUNK_SIZE
        overlap = settings.CHUNK_OVERLAP
        lines = text.splitlines(keepends=True)

        chunks, current, current_len = [], [], 0
        for line in lines:
            current.append(line)
            current_len += len(line)
            if current_len >= chunk_size:
                chunks.append("".join(current))
                # keep overlap lines
                overlap_lines, overlap_len = [], 0
                for l in reversed(current):
                    overlap_len += len(l)
                    overlap_lines.insert(0, l)
                    if overlap_len >= overlap:
                        break
                current = overlap_lines
                current_len = overlap_len

        if current:
            chunks.append("".join(current))

        return [c for c in chunks if c.strip()]

    def _read_file(self, file_path: str, name: str) -> str:
        """Extract text from a file based on its extension."""
        ext = os.path.splitext(name)[1].lower()
        supported = {".py", ".js", ".ts", ".txt", ".md", ".pdf"}
        if ext not in supported:
            return ""
        try:
            if ext == ".pdf":
                import pdfplumber
                with pdfplumber.open(file_path) as pdf:
                    return "\n".join(
                        page.extract_text() or "" for page in pdf.pages
                    )
            else:
                with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                    return f.read()
        except Exception:
            return ""
