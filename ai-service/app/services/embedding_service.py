import logging

from fastapi import Request
from sklearn.metrics.pairwise import cosine_similarity
from sentence_transformers import SentenceTransformer

logger = logging.getLogger(__name__)


class EmbeddingService:
    """
    Wraps the sentence-transformers model.
    One instance is created at startup and stored on app.state.
    Never instantiated at import time.
    """

    def __init__(self, model: SentenceTransformer) -> None:
        self._model = model

    def generate_embedding(self, text: str) -> list[float]:
        vector = self._model.encode(text, normalize_embeddings=True)
        return vector.tolist()

    def calculate_similarity(
        self,
        vec1: list[float],
        vec2: list[float],
    ) -> float:
        similarity = cosine_similarity([vec1], [vec2])
        return float(similarity[0][0])


def get_embedding_service(request: Request) -> EmbeddingService:
    return request.app.state.embedding_service
