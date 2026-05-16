# app/utils/normalization.py
import re

# The four canonical education levels — single source of truth.
# parse_education and _derive_education_level_from_raw already return
# one of these values. normalize_education_level just validates.
_VALID_EDUCATION_LEVELS = {"olevel", "bachelor", "master", "phd"}


def normalize_all_fields(parsed: dict) -> dict:
    """
    Normalise and clean all parsed resume fields in place.

    By the time this runs, parse_service.py has already:
    - Unpacked education entries into a flat list
    - Derived education_level as a canonical string or None

    This function's job is cleaning and deduplication only —
    not re-deriving values that were already computed upstream.
    """
    normalized = dict(parsed)

    # ── Skills ───────────────────────────────────────────────
    normalized["skills"] = _normalize_string_list(normalized.get("skills", []))

    # ── Projects ─────────────────────────────────────────────
    projects = []
    for project in normalized.get("projects", []):
        if not isinstance(project, dict):
            continue
        projects.append({
            "name": _normalize_project_name(project.get("name")),
            "technologies": _normalize_string_list(project.get("technologies", [])),
        })
    normalized["projects"] = projects

    # ── Education ────────────────────────────────────────────
    # parse_service.py passes education as a flat list of entry dicts
    # and education_level as a canonical string — just validate and pass through.
    education = normalized.get("education")
    if isinstance(education, list):
        normalized["education"] = education
    else:
        normalized["education"] = []

    normalized["education_level"] = _validate_education_level(
        normalized.get("education_level")
    )

    # ── Certifications ───────────────────────────────────────
    normalized["certifications"] = _dedupe_preserve_order([
        item.strip()
        for item in normalized.get("certifications", [])
        if isinstance(item, str) and item.strip()
    ])

    # ── Experience ───────────────────────────────────────────
    experience = normalized.get("experience")
    if isinstance(experience, dict):
        total_years = experience.get("total_years")
        if isinstance(total_years, (int, float)):
            experience["total_years"] = min(round(float(total_years), 2), 30.0)
        normalized["experience"] = experience

    return normalized


# ─────────────────────────────────────────────
# Field normalisers
# ─────────────────────────────────────────────

def _normalize_string_list(values: list) -> list[str]:
    """
    Deduplicate, lowercase, and sort a list of strings.
    Non-string items are silently dropped.
    """
    cleaned = set()
    for value in values:
        if not isinstance(value, str):
            continue
        token = re.sub(r"\s+", " ", value).strip().lower()
        if token:
            cleaned.add(token)
    return sorted(cleaned)


def _validate_education_level(value: str | None) -> str | None:
    """
    Validate that education_level is one of the four canonical values.
    Returns None if the value is absent or unrecognised.

    The mapping from raw text → canonical level happens upstream in
    parse_education and _derive_education_level_from_raw — not here.
    """
    if not value or not isinstance(value, str):
        return None
    return value if value in _VALID_EDUCATION_LEVELS else None


def _normalize_project_name(value: str | None) -> str | None:
    """
    Strip and return the project name as-is.
    We do not call .title() — it destroys camelCase and acronyms.
    e.g. "LoanTrack" would become "Loantrack".
    """
    if not value or not isinstance(value, str):
        return None
    return re.sub(r"\s+", " ", value).strip() or None


def _dedupe_preserve_order(values: list[str]) -> list[str]:
    """
    Remove duplicates from a list while preserving original order.
    Case-insensitive deduplication.
    """
    seen: set[str] = set()
    result: list[str] = []
    for value in values:
        key = value.lower()
        if key not in seen:
            seen.add(key)
            result.append(value)
    return result