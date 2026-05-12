from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
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
    description: Optional[str] = None
    technologies: list[str] = Field(default_factory=list)


class CertificationItem(BaseModel):
    name: Optional[str] = None
    issuer: Optional[str] = None
    issue_date: Optional[str] = None


class PortfolioItem(BaseModel):
    personal_site: Optional[str] = None
    github: Optional[str] = None
    linkedin: Optional[str] = None
    other_links: list[str] = Field(default_factory=list)


class ParsedCandidate(BaseModel):
    
    model_config = ConfigDict(
        extra="ignore"
    )
    
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None

    skills: list[str] = Field(default_factory=list)

    education: list[EducationEntry] = Field(default_factory=list)
    experience: Optional[ExperienceSummary] = None
    projects: list[ProjectItem] = Field(default_factory=list)

    certifications: list[str] = Field(default_factory=list)

    # Portfolio site: github, linkedin and co
    portfolio: Optional[PortfolioItem] = None
    
    # secondary, masters, phd, bsc
    education_level: Optional[EducationLevel] = None

    years_experience: Optional[float] = Field(
        default=None,
        ge=0
    )

    raw_text: Optional[str] = None
    readable_summary: Optional[str] = None   
    
