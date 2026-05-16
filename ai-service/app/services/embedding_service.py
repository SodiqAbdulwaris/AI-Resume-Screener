import logging
from pathlib import Path

from fastapi import Request
from sklearn.metrics.pairwise import cosine_similarity
from sentence_transformers import SentenceTransformer

logger = logging.getLogger(__name__)


class EmbeddingService:
    def __init__(self, model: SentenceTransformer) -> None:
        self._model = model

    def generate_embedding(self, text: str) -> list[float]:
        if not text or not text.strip():
            raise ValueError("Cannot generate embedding for empty text.")
        vector = self._model.encode(text, normalize_embeddings=True)
        return vector.tolist()

    def calculate_similarity(
        self,
        vec1: list[float],
        vec2: list[float],
    ) -> float:
        raw = cosine_similarity([vec1], [vec2])
        return float(max(0.0, min(1.0, raw[0][0])))


def load_embedding_model(model_name: str, cache_dir: str) -> SentenceTransformer:
    local_path = Path(cache_dir) / model_name

    if local_path.exists():
        logger.info(f"Loading embedding model from local cache: {local_path}")
        return SentenceTransformer(str(local_path))

    logger.info(
        f"Local model not found at {local_path}. "
        f"Downloading '{model_name}' from Hugging Face."
    )
    model = SentenceTransformer(model_name)

    local_path.mkdir(parents=True, exist_ok=True)
    model.save(str(local_path))
    logger.info(f"Model saved to {local_path} for future use.")

    return model


def get_embedding_service(request: Request) -> EmbeddingService:
    service = getattr(request.app.state, "embedding_service", None)
    if service is None:
        raise RuntimeError(
            "EmbeddingService is not initialised. "
            "Ensure the FastAPI lifespan loaded the model correctly."
        )
    return service