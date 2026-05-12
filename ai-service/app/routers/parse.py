from fastapi import APIRouter, UploadFile, File

from app.schemas.resume import ParsedCandidate
from app.services.parser_service import parse_resume_service

router = APIRouter()
@router.post("/parse", response_model=ParsedCandidate)
async def parse_resume(file: UploadFile = File(...)):
    return await parse_resume_service(file)

