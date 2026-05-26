import re

from fastapi import UploadFile

from app.config.parser_config import DEGREE_PATTERNS
from app.core.exceptions import AppException, EmptyResumeError, ResumeParsingError
from app.core.logger import logger
from app.parsers.certification_parser import parse_certifications
from app.parsers.contact_parser import parse_contact
from app.parsers.education_parser import parse_education
from app.parsers.experience_parser import parse_experience
from app.parsers.project_parser import parse_projects
from app.parsers.skills_parser import parse_skills
from app.schemas.resume import (
    EducationEntry,
    ExperienceEntry,
    ExperienceSummary,
    ParsedCandidate,
    ProjectItem,
)
from app.services.ai_parse_service import maybe_parse_resume_with_ai
from app.utils.extractor import extract_text_from_file
from app.utils.normalization import normalize_all_fields
from app.utils.section_splitter import split_into_sections
from app.utils.timing import log_time
from app.utils.pre_processor import preprocess


async def parse_resume_service(file: UploadFile) -> ParsedCandidate:
    with log_time("parse_resume_service"):
        try:
            logger.info("Starting resume parsing pipeline")
            raw_text = extract_text_from_file(file)
            if not raw_text or not raw_text.strip():
                raise EmptyResumeError()
            return await parse_resume_text(raw_text)
        except AppException:
            raise
        except Exception as exc:
            import traceback
            traceback.print_exc()
            logger.error("Resume parsing pipeline failed", exc_info=True)
            raise ResumeParsingError(str(exc))
async def parse_resume_text(raw_text: str) -> ParsedCandidate:
    marked_text, clean_text = preprocess(raw_text)
    sections = split_into_sections(marked_text)
    heuristic_candidate = build_heuristic_candidate(clean_text, sections)
    fallback_reasons = get_ai_fallback_reasons(heuristic_candidate)

    if fallback_reasons:
        ai_candidate = await maybe_parse_resume_with_ai(
            raw_text=clean_text,
            sections=sections,
            heuristic_candidate=heuristic_candidate,
            fallback_reasons=fallback_reasons,
        )
        if ai_candidate is not None:
            logger.info(
                "Resume parsing completed with AI fallback",
                extra={"fallback_reasons": fallback_reasons},
            )
            return ai_candidate

    logger.info("Resume parsing completed successfully")
    return heuristic_candidate


def build_heuristic_candidate(
    clean_text: str,
    sections: dict[str, str],
) -> ParsedCandidate:
    contact = parse_contact(sections["contact"])

    education_data = parse_education(sections["education"])

    education_entries = education_data.get("entries", [])
    highest_raw = education_data.get("highest_raw")
    education_level = highest_raw or get_education_level(clean_text)

    experience_data = parse_experience(sections["experience"])
    experience_entries = [
        ExperienceEntry(
            role=entry.get("role"),
            company=entry.get("company"),
            start_year=entry.get("start_year"),
            end_year=entry.get("end_year"),
        )
        for entry in experience_data.get("entries", [])
        if isinstance(entry, dict)
    ]
    experience_summary = (
        ExperienceSummary(
            entries=experience_entries,
            total_years=experience_data.get("total_years", 0.0),
        )
        if experience_data
        else None
    )

    parsed = {
        "raw_text": clean_text,
        **contact,
        "skills": parse_skills(sections["skills"]),
        "projects": parse_projects(sections["projects"]),
        "education": education_entries,
        "education_level": education_level,
        "experience": experience_data,
        "certifications": parse_certifications(sections["certifications"]),
    }

    normalized = normalize_all_fields(parsed)
    cleaned = cleanup_empty_values(normalized)

    candidate = ParsedCandidate(
        full_name=cleaned.get("full_name"),
        email=cleaned.get("email"),
        phone=cleaned.get("phone"),
        location=cleaned.get("location"),
        skills=cleaned.get("skills", []),
        education=[
            EducationEntry(**entry)
            for entry in cleaned.get("education", [])
            if isinstance(entry, dict)
        ],
        education_level=cleaned.get("education_level"),
        experience=experience_summary,
        projects=[
            ProjectItem(**entry)
            for entry in cleaned.get("projects", [])
            if isinstance(entry, dict)
        ],
        certifications=cleaned.get("certifications", []),
        raw_text=clean_text,
    )

    if candidate.experience is not None:
        candidate.years_experience = candidate.experience.total_years

    return candidate


def get_ai_fallback_reasons(candidate: ParsedCandidate) -> list[str]:
    reasons: list[str] = []

    if not candidate.full_name:
        reasons.append("missing_full_name")
    if not candidate.email and not candidate.phone:
        reasons.append("missing_contact_info")
    if not candidate.skills:
        reasons.append("missing_skills")
    if candidate.experience is None or not candidate.experience.entries:
        reasons.append("missing_experience")
    if not candidate.education:
        reasons.append("missing_education")

    return reasons


def get_education_level(raw_text: str) -> str | None:
    lowered = raw_text.lower()
    highest_rank = -1
    highest_level = None

    for level, pattern in DEGREE_PATTERNS:
        if re.search(pattern, lowered, re.IGNORECASE):
            from app.config.parser_config import DEGREE_HIERARCHY
            rank = DEGREE_HIERARCHY.get(level, -1)
            if rank > highest_rank:
                highest_rank = rank
                highest_level = level

    return highest_level


def cleanup_empty_values(payload: dict) -> dict:
    cleaned = {}

    for key, value in payload.items():
        if value is None:
            continue
        if isinstance(value, str) and not value.strip():
            continue
        if isinstance(value, list):
            nested_list = []
            for item in value:
                if isinstance(item, dict):
                    nested_item = cleanup_empty_values(item)
                    if nested_item:
                        nested_list.append(nested_item)
                elif item not in (None, "", []):
                    nested_list.append(item)
            if nested_list:
                cleaned[key] = nested_list
            continue
        if isinstance(value, dict):
            nested_dict = cleanup_empty_values(value)
            if nested_dict:
                cleaned[key] = nested_dict
            continue
        cleaned[key] = value

    return cleaned
