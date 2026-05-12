from pydantic import BaseModel, Field
from typing import Optional
from app.schemas.common import EducationLevel


class CandidateInput(BaseModel):
    candidate_id: str

    full_name: Optional[str] = None
    email: Optional[str] = None

    skills: list[str] = Field(default_factory=list)

    years_experience: float = Field(
        default=0.0,
        ge=0
    )

    education_level: Optional[EducationLevel] = None

    raw_text: Optional[str] = None


class JobInput(BaseModel):
    job_id: str

    title: str
    description: str

    required_skills: list[str] = Field(default_factory=list)

    preferred_skills: list[str] = Field(default_factory=list)

    required_experience_years: float = Field(
        default=0.0,
        ge=0
    )

    required_education_level: Optional[EducationLevel] = None


class MatchRequest(BaseModel):
    job: JobInput

    candidates: list[CandidateInput]



class ScoreBreakdown(BaseModel):
    skills_score: float = Field(
        default=0.0,
        ge=0,
        le=1
    )

    experience_score: float = Field(
        default=0.0,
        ge=0,
        le=1
    )

    semantic_score: float = Field(
        default=0.0,
        ge=0,
        le=1
    )

    education_score: float = Field(
        default=0.0,
        ge=0,
        le=1
    )


class RankedCandidate(BaseModel):
    candidate_id: str

    full_name: Optional[str] = None

    total_score: float = Field(
        default=0.0,
        ge=0,
        le=1
    )

    matched_skills: list[str] = Field(default_factory=list)

    missing_skills: list[str] = Field(default_factory=list)

    score_breakdown: ScoreBreakdown
    reasons: list[str] = Field(default_factory=list)
    readable_summary: Optional[str] = None



class MatchResponse(BaseModel):
    job_id: str

    ranked_candidates: list[RankedCandidate]
