import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from sentence_transformers import SentenceTransformer

from huggingface_hub import login

from app.config.settings import get_settings
from app.core.exceptions import AppException
from app.core.middleware import RequestLoggingMiddleware
from app.routers.parse import router as parse_router
from app.routers.match import router as match_router
from app.services.embedding_service import EmbeddingService

settings = get_settings()
logger = logging.getLogger(__name__)

hf_token = settings.HF_TOKEN
if hf_token:
    login(token=hf_token) 

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Loading embedding model: %s", settings.EMBEDDING_MODEL)
    raw_model = SentenceTransformer(settings.EMBEDDING_MODEL)
    app.state.embedding_service = EmbeddingService(raw_model)
    logger.info("Embedding model loaded and ready.")

    yield

    logger.info("AI service shutting down.")


app = FastAPI(title="AI Resume Screening Service", lifespan=lifespan)

app.include_router(parse_router)
app.include_router(match_router)

app.add_middleware(RequestLoggingMiddleware)


@app.get("/health")
def health():
    return {"status": "ok", "port": settings.AI_SERVICE_PORT}


@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException):
    return JSONResponse(
        status_code=400,
        content={
            "success": False,
            "message": exc.message,
            "error_code": exc.error_code,
        },
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled exception during request")
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "message": "Internal server error",
            "error_code": "INTERNAL_ERROR",
        },
    )
