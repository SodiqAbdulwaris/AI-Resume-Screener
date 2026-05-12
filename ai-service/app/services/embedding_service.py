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
        """
        Encode a string and return a normalised embedding as a plain Python list.
        normalize_embeddings=True ensures vectors are unit-length,
        which makes cosine similarity equivalent to a dot product.
        """
        vector = self._model.encode(text, normalize_embeddings=True)
        return vector.tolist()

    def calculate_similarity(
        self,
        vec1: list[float],
        vec2: list[float],
    ) -> float:
        """
        Return cosine similarity between two embedding vectors.
        Output is in range [-1.0, 1.0]; in practice always [0.0, 1.0]
        for normalised text embeddings.
        """
        similarity = cosine_similarity([vec1], [vec2])
        return float(similarity[0][0])


def get_embedding_service(request: Request) -> EmbeddingService:
    """
    FastAPI dependency. Pulls the EmbeddingService instance off app.state.
    Usage in a router:

        from fastapi import Depends, Request
        from app.services.embedding_service import EmbeddingService, get_embedding_service

        @router.post("/match/")
        async def match(
            body: MatchRequest,
            embedding_service: EmbeddingService = Depends(get_embedding_service),
        ):
            vec = embedding_service.generate_embedding(body.job.description)
    """
    return request.app.state.embedding_service
