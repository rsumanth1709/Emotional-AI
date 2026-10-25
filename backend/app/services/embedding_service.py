"""
MindCare AI — Dense Semantic Embedding Service
Uses sentence-transformers ('all-MiniLM-L6-v2') to produce 384-dimensional
L2-normalized dense embeddings for vector retrieval and similarity evaluation.
"""
import hashlib
import numpy as np
from typing import List, Optional
from app.utils.logger import logger

try:
    from sentence_transformers import SentenceTransformer
except ImportError:
    SentenceTransformer = None
    logger.warning("sentence-transformers not installed; EmbeddingService will use fallback.")

MODEL_NAME = "all-MiniLM-L6-v2"
EMBEDDING_DIM = 384


class EmbeddingService:
    """Manages dense semantic embedding generation with L2 normalization."""

    def __init__(self, model_name: str = MODEL_NAME):
        self.model_name = model_name
        self._model = None
        self._initialized = False

    def _init_model(self):
        if self._initialized:
            return
        self._initialized = True
        if SentenceTransformer is not None:
            try:
                logger.info(f"Loading SentenceTransformer embedding model '{self.model_name}'...")
                self._model = SentenceTransformer(self.model_name)
                logger.info(f"SentenceTransformer '{self.model_name}' loaded successfully (dim={EMBEDDING_DIM}).")
            except Exception as e:
                logger.error(f"Failed to load SentenceTransformer '{self.model_name}': {e}")
                self._model = None
        else:
            self._model = None

    @property
    def is_available(self) -> bool:
        self._init_model()
        return self._model is not None

    def embed_query(self, query: str) -> List[float]:
        """Embed a single query string, returning an L2-normalized float list."""
        if not query or not query.strip():
            return [0.0] * EMBEDDING_DIM
        return self.embed_documents([query])[0]

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        """Embed a batch of document strings, returning L2-normalized float lists."""
        if not texts:
            return []

        self._init_model()

        if self._model is not None:
            try:
                # normalize_embeddings=True ensures inner-product equals cosine similarity
                embeddings = self._model.encode(
                    texts,
                    normalize_embeddings=True,
                    show_progress_bar=False,
                    batch_size=32,
                )
                if isinstance(embeddings, np.ndarray):
                    return embeddings.tolist()
                return [list(e) for e in embeddings]
            except Exception as e:
                logger.error(f"Model encoding error: {e}. Falling back to deterministic embedding.")

        # Fallback deterministic pseudo-embedding
        return [self._fallback_embed(t) for t in texts]

    def _fallback_embed(self, text: str) -> List[float]:
        """Deterministic 384-dimensional unit vector derived from text hash for test resilience."""
        clean = text.lower().strip()
        vec = np.zeros(EMBEDDING_DIM, dtype=np.float32)
        words = clean.split()
        if not words:
            vec[0] = 1.0
            return vec.tolist()

        for w in words:
            h = int(hashlib.md5(w.encode("utf-8")).hexdigest(), 16)
            idx = h % EMBEDDING_DIM
            vec[idx] += 1.0

        norm = np.linalg.norm(vec)
        if norm > 0:
            vec = vec / norm
        else:
            vec[0] = 1.0
        return vec.tolist()


# Global singleton
embedding_service = EmbeddingService()
