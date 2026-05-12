import re


EDUCATION_MAP = {
    "phd": "phd",
    "doctorate": "phd",
    "doctor of philosophy": "phd",
    "master": "master",
    "masters": "master",
    "msc": "master",
    "mba": "master",
    "bachelor": "bachelor",
    "bsc": "bachelor",
    "hnd": "bachelor",
    "olevel": "olevel",
    "o-level": "olevel",
    "a-level": "olevel",
    "waec": "olevel",
    "neco": "olevel",
    "ssce": "olevel",
}


def normalize_all_fields(parsed: dict) -> dict:
    normalized = dict(parsed)

    normalized["skills"] = normalize_string_list(normalized.get("skills", []))

    projects = []
    for project in normalized.get("projects", []):
        if not isinstance(project, dict):
            continue
        name = project.get("name")
        technologies = normalize_string_list(project.get("technologies", []))
        projects.append(
            {
                "name": normalize_project_name(name),
                "technologies": technologies,
            }
        )
    normalized["projects"] = projects

    education = normalized.get("education")
    if isinstance(education, dict):
        normalized["education"] = education.get("entries", [])
        normalized["education_level"] = normalize_education_level(
            education.get("highest_raw")
        )
    else:
        normalized["education"] = []
        normalized["education_level"] = None

    normalized["certifications"] = dedupe_preserve_order(
        [
            item.strip()
            for item in normalized.get("certifications", [])
            if isinstance(item, str) and item.strip()
        ]
    )

    experience = normalized.get("experience")
    if isinstance(experience, dict):
        total_years = experience.get("total_years")
        if isinstance(total_years, (int, float)):
            experience["total_years"] = min(round(float(total_years), 2), 30.0)
        normalized["experience"] = experience

    return normalized


def normalize_string_list(values: list[str]) -> list[str]:
    cleaned = []
    for value in values:
        if not isinstance(value, str):
            continue
        token = re.sub(r"\s+", " ", value).strip().lower()
        if token:
            cleaned.append(token)

    return sorted(set(cleaned))


def normalize_education_level(value: str | None) -> str | None:
    if not value or not isinstance(value, str):
        return None

    cleaned = re.sub(r"\s+", " ", value).strip().lower()
    return EDUCATION_MAP.get(cleaned)


def normalize_project_name(value: str | None) -> str | None:
    if not value or not isinstance(value, str):
        return None
    cleaned = re.sub(r"\s+", " ", value).strip()
    return cleaned.title() if cleaned else None


def dedupe_preserve_order(values: list[str]) -> list[str]:
    seen = set()
    ordered = []

    for value in values:
        key = value.lower()
        if key in seen:
            continue
        seen.add(key)
        ordered.append(value)

    return ordered
