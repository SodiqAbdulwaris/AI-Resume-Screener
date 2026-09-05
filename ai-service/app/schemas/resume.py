from typing import Optional
from pydantic import BaseModel, ConfigDict, Field

from app.schemas.common import EducationLevel


class ExperienceEntry(BaseModel):
    role: Optional[str] = None
    company: Optional[str] = None
    start_year: Optional[int] = None
    end_year: Optional[int] = None


class ExperienceSummary(BaseModel):
    entries: list[ExperienceEntry] = Field(default_factory=list)
    total_years: float = Field(default=0.0, ge=0, le=30)


class EducationEntry(BaseModel):
    institution: Optional[str] = None
    degree: Optional[str] = None
    start_year: Optional[int] = None
    end_year: Optional[int] = None
    gpa: Optional[str] = None


class ProjectItem(BaseModel):
    name: Optional[str] = None
    technologies: list[str] = Field(default_factory=list)


class ParsedCandidate(BaseModel):
    model_config = ConfigDict(extra="ignore")

    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None

    skills: list[str] = Field(default_factory=list)

    education: list[EducationEntry] = Field(default_factory=list)
    education_level: Optional[EducationLevel] = None

    experience: Optional[ExperienceSummary] = None
    years_experience: Optional[float] = Field(default=None, ge=0)

    projects: list[ProjectItem] = Field(default_factory=list)
    certifications: list[str] = Field(default_factory=list)

    raw_text: Optional[str] = None

    # True when parsing extracted too little to trust — the caller got a 200
    # response, but the resume should be flagged for the candidate to review
    # rather than silently treated as a clean, complete profile.
    needs_review: bool = False
    fallback_reasons: list[str] = Field(default_factory=list)

    # "ocr" means the PDF had no extractable text layer and was rasterized +
    # OCR'd instead (see app.utils.extractor). ocr_confidence is Tesseract's
    # mean per-word confidence (0-100), None when extraction_method is "text".
    extraction_method: str = "text"
    ocr_confidence: Optional[float] = None