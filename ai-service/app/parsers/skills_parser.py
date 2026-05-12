import re
SKILL_SPLIT_PATTERN = re.compile(r",")
SKILL_LABEL_PATTERN = re.compile(
    r"^(skills|technical skills|core competencies|technologies)\s*:?\s*",
    re.IGNORECASE,
)
LABEL_PREFIXES = {
    "languages",
    "frameworks & libraries",
    "frameworks",
    "libraries",
    "tools",
    "architecture & design",
    "architecture",
    "design",
    "other",
}
STOP_WORDS = {"and", "or", "the", "with", "using", "a", "an"}
SKIP_TOKENS = {
    "google docs", "google sheets", "google slides",
    "sheets", "slides", "powerbi", "power bi",
    "microsoft word", "microsoft excel"
}


def parse_skills(section_text: str) -> list[str]:
    raw_skills = []
    seen = set()

    for line in section_text.splitlines():
        stripped = line.strip()
        if not stripped:
            continue

        stripped = SKILL_LABEL_PATTERN.sub("", stripped)
        stripped = strip_inline_label(stripped)
        parts = [part.strip() for part in SKILL_SPLIT_PATTERN.split(stripped)]

        if len(parts) == 1 and parts[0] == stripped and stripped.startswith(("-", "*")):
            parts = [stripped.lstrip("-* ").strip()]

        for part in parts:
            normalized = normalize_skill_token(part)
            if normalized and normalized not in seen:
                seen.add(normalized)
                raw_skills.append(normalized)

    return sorted(raw_skills)


def strip_inline_label(value: str) -> str:
    if ":" not in value:
        return value

    prefix, remainder = value.split(":", 1)
    normalized_prefix = re.sub(r"\s+", " ", prefix.strip().lower())

    if normalized_prefix in LABEL_PREFIXES or len(prefix.strip().split()) < 4:
        return remainder.strip()

    return value


def normalize_skill_token(value: str) -> str | None:
    cleaned = value.strip().lower()
    cleaned = re.sub(r"^[\-\u2022*]+\s*", "", cleaned)
    cleaned = re.sub(r"\s+", " ", cleaned).strip(" .:;|")

    if len(cleaned) <= 1:
        return None
    if cleaned in STOP_WORDS or cleaned in SKIP_TOKENS:
        return None

    return cleaned
