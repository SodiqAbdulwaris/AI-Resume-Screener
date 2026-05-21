from fastapi import APIRouter, File, UploadFile

from app.config.settings import get_settings
from app.core.exceptions import FileTooLargeError
from app.schemas.resume import ParsedCandidate
from app.services.parse_service import parse_resume_service

router = APIRouter()
settings = get_settings()


@router.post("/parse/", response_model=ParsedCandidate)
async def parse_resume(file: UploadFile = File(...)):
    contents = await file.read()

    if len(contents) > settings.MAX_FILE_SIZE_MB * 1024 * 1024:
        raise FileTooLargeError(
            filename=file.filename,
            size_mb=round(len(contents) / (1024 * 1024), 2),
            max_mb=settings.MAX_FILE_SIZE_MB,
        )

    await file.seek(0)
    return await parse_resume_service(file)