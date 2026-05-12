import re


SECTION_KEYS = (
    "contact",
    "skills",
    "education",
    "experience",
    "projects",
    "certifications",
    "other",
)

SECTION_ALIASES = {
    "contact": "contact",
    "personal details": "contact",
    "personal information": "contact",
    "contact details": "contact",
    "skills": "skills",
    "technical skills": "skills",
    "key skills": "skills",
    "core competencies": "skills",
    "competencies": "skills",
    "education": "education",
    "academic background": "education",
    "academic qualifications": "education",
    "experience": "experience",
    "work experience": "experience",
    "professional experience": "experience",
    "employment history": "experience",
    "career history": "experience",
    "projects": "projects",
    "personal projects": "projects",
    "selected projects": "projects",
    "certifications": "certifications",
    "certificates": "certifications",
    "licenses": "certifications",
    "licences": "certifications",
}

HEADING_PATTERN = re.compile(r"^(?P<title>[A-Za-z][A-Za-z &/\-]{1,50})(?::)?$")


def split_into_sections(text: str) -> dict[str, str]:
    sections = {key: "" for key in SECTION_KEYS}
    lines = [line.rstrip() for line in text.splitlines()]

    current_section = "other"
    buffers = {key: [] for key in SECTION_KEYS}

    for raw_line in lines:
        line = raw_line.strip()
        if not line:
            continue

        heading = classify_heading(line)
        if heading:
            current_section = heading
            continue

        buffers[current_section].append(line)

    for key in SECTION_KEYS:
        sections[key] = "\n".join(buffers[key]).strip()

    return sections


def classify_heading(line: str) -> str | None:
    match = HEADING_PATTERN.match(line)
    if not match:
        return None

    normalized = re.sub(r"\s+", " ", match.group("title").lower()).strip()
    return SECTION_ALIASES.get(normalized)
