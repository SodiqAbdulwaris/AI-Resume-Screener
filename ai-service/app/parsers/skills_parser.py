import re

from app.config.parser_config import SKILL_STOP_WORDS as STOP_WORDS
from app.config.parser_config import SKILL_SKIP_TOKENS as SKIP_TOKENS

SKILL_SPLIT_PATTERN = re.compile(r",")

SKILL_SECTION_HEADER_PATTERN = re.compile(
    r"^(skills|technical skills|core competencies|technologies|areas of expertise)\s*:?\s*$",
    re.IGNORECASE,
)

INLINE_LABEL_PATTERN = re.compile(
    r"^([A-Za-z0-9&/()\-\s]{1,40}?)\s*:\s*",
)

LABEL_PREFIXES = {
    "languages", "other", "tools", "frameworks", "libraries",
    "frameworks & libraries", "architecture", "design",
    "architecture & design",
    "frontend", "backend", "databases", "database",
    "web", "mobile",
    "devops", "cloud", "cloud platforms", "containers & orchestration",
    "containers", "orchestration", "infrastructure as code",
    "ci/cd", "monitoring & observability", "monitoring", "observability",
    "networking", "security",
    "primary", "secondary", "tertiary",
    "testing", "test",
    "scripting", "scripting languages",
    "ml frameworks", "ml/dl", "ml / dl",
    "data tools", "data", "big data",
    "nlp", "mlops",
    "offensive security", "defensive / soc", "defensive",
    "cloud security", "devsecops", "forensics",
    "soft skills", "concepts", "version control",
    "ios frameworks", "cross-platform", "tooling",
    "observability tools",
    "tools & devops", "tools & technologies",
}


def split_table_row(line: str) -> tuple[str | None, str]:
    match = re.match(r"^([A-Za-z][A-Za-z\s&/]{1,30}?)\s{2,}(.+)$", line)
    if not match:
        return None, line
    label = match.group(1).strip().lower()
    value = match.group(2).strip()
    return label, value

def parse_skills(section_text: str) -> list[str]:
    raw_skills = []
    seen = set()

    for line in section_text.splitlines():
        stripped = line.strip()
        if not stripped:
            continue

        if SKILL_SECTION_HEADER_PATTERN.match(stripped):
            continue

        if stripped.lower() in LABEL_PREFIXES or stripped.lower() in SKIP_TOKENS:
            continue

        label, stripped = split_table_row(stripped)
        if label and label in LABEL_PREFIXES:
            pass
        elif label:
            stripped = line.strip()

        sub_lines = split_collapsed_categories(stripped)

        for sub_line in sub_lines:
            sub_line = strip_leading_label(sub_line)
            if not sub_line:
                continue

            parts = split_respecting_parens(sub_line)

            for part in parts:
                part = strip_leading_label(part)
                normalized = normalize_skill_token(part)
                if normalized and normalized not in seen:
                    seen.add(normalized)
                    raw_skills.append(normalized)

    return sorted(raw_skills)

def split_collapsed_categories(line: str) -> list[str]:
    boundary = re.compile(
        r"(?<=[a-z0-9\s,)])\s+(?=[A-Z][A-Za-z&/()\-]*(?:\s+[A-Z][A-Za-z&/()\-]*){0,3}\s*:)"
    )
    parts = boundary.split(line)
    return [p.strip() for p in parts if p.strip()]

def split_table_row(line: str) -> tuple[str | None, str]:
    match = re.match(r"^([A-Za-z][A-Za-z\s&/]{1,30}?)\s{2,}(.+)$", line)
    if not match:
        return None, line
    label = match.group(1).strip().lower()
    value = match.group(2).strip()
    return label, value

def split_respecting_parens(text: str) -> list[str]:
    parts = []
    depth = 0
    current: list[str] = []

    for char in text:
        if char == "(":
            depth += 1
            current.append(char)
        elif char == ")":
            depth = max(depth - 1, 0)
            current.append(char)
        elif char == "," and depth == 0:
            parts.append("".join(current).strip())
            current = []
        else:
            current.append(char)

    if current:
        parts.append("".join(current).strip())

    return [p for p in parts if p]


def strip_leading_label(value: str) -> str:
    if ":" not in value:
        return value

    match = INLINE_LABEL_PATTERN.match(value)
    if not match:
        return value

    prefix = match.group(1).strip().lower()
    prefix = re.sub(r"\s+", " ", prefix)

    if prefix in LABEL_PREFIXES:
        remainder = value[match.end():].strip()
        return remainder

    return value

def normalize_skill_token(value: str) -> str | None:
    cleaned = value.strip().lower()
    cleaned = re.sub(r"^[\-\u2022*▪·]+\s*", "", cleaned)
    cleaned = re.sub(r"\s+", " ", cleaned).strip(" .:;|")
    cleaned = re.sub(r"\s*\(.*?\)\s*", "", cleaned).strip()
    cleaned = cleaned.strip("()")

    if len(cleaned) <= 1:
        return None
    if cleaned in STOP_WORDS:
        return None
    if cleaned in SKIP_TOKENS:
        return None
    if len(cleaned.split()) > 6:
        return None

    return cleaned
