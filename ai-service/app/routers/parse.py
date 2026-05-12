from fastapi import APIRouter, UploadFile, File

from app.schemas.resume import ParsedCandidate
from app.services.parser_service import parse_resume_service
from app.core.exceptions import FileTooLargeError
from app.config.settings import settings

router = APIRouter()

@router.post("/parse", response_model=ParsedCandidate)
async def parse_resume(file: UploadFile = File(...)):
    contents = await file.read()

    if len(contents) > settings.MAX_FILE_SIZE_MB * 1024 * 1024:
        raise FileTooLargeError(
            filename=file.filename,
            size_mb=round(len(contents) / (1024 * 1024), 2),
            max_mb=settings.MAX_FILE_SIZE_MB
        )

    await file.seek(0)
    return await parse_resume_service(file)