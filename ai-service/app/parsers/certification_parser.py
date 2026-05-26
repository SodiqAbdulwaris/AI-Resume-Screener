import re

from app.config.parser_config import CERT_ISSUER_KEYWORDS

_YEAR_PATTERN = re.compile(r"\s*\(?\b(19|20)\d{2}\b\)?")

_STATUS_PATTERN = re.compile(
    r"\s*[-–—]?\s*\(?(in progress|ongoing|expected|anticipated)\)?",
    re.IGNORECASE,
)

_ISSUER_SEPARATOR = re.compile(r"\s*(?:[-–—]| by |\|)\s*", re.IGNORECASE)

_NOISE_PATTERN = re.compile(
    r"^(none|n/a|languages?|english|french|spanish|arabic|german|mandarin"
    r"|japanese|portuguese|fluent|native|conversational|professional"
    r"|basic|intermediate|advanced|speaker|mentor|competitor|volunteer"
    r"|rank|top \d|currently reading|i prefer)\b",
    re.IGNORECASE,
)

_BULLET_PREFIX = re.compile(r"^\s*(?:\d+[\).\s]+|[•\-*▪·]\s*)")


def parse_certifications(section_text: str) -> list[str]:
    certifications = []
    seen: set[str] = set()

    for line in section_text.splitlines():
        stripped = _BULLET_PREFIX.sub("", line.strip()).strip()
        if not stripped:
            continue

        if _NOISE_PATTERN.match(stripped):
            continue

        candidates = split_line(stripped)

        for candidate in candidates:
            name = clean_cert_name(candidate)
            if not name:
                continue
            if not looks_like_certification(name):
                continue
            normalised = name.lower()
            if normalised not in seen:
                seen.add(normalised)
                certifications.append(name)

    return certifications


def split_line(line: str) -> list[str]:
    if "," not in line:
        return [line]

    parts = [p.strip() for p in line.split(",") if p.strip()]
    if all(len(p.split()) <= 6 for p in parts):
        return parts

    return [line]


def clean_cert_name(value: str) -> str:
    cleaned = value.strip()

    parts = _ISSUER_SEPARATOR.split(cleaned)
    if len(parts) >= 2:
        potential_issuer = parts[-1].strip().lower()
        if any(kw in potential_issuer for kw in CERT_ISSUER_KEYWORDS):
            cleaned = parts[0].strip()

    cleaned = _YEAR_PATTERN.sub("", cleaned)
    cleaned = re.sub(
        r"\(\s*part qualified.*?\)",
        "",
        cleaned,
        flags=re.IGNORECASE,
    )
    cleaned = _STATUS_PATTERN.sub("", cleaned)
    cleaned = re.sub(r"\(\s*\)", "", cleaned)
    cleaned = cleaned.strip(" .,;:—–-")

    return cleaned


def looks_like_certification(name: str) -> bool:
    if not name or len(name) <= 2:
        return False

    lowered = name.lower()

    if any(kw in lowered for kw in CERT_ISSUER_KEYWORDS):
        return True

    prose_connectors = re.compile(
        r"\b(i |we |my |the |and |or |for |with |that |this |which |prefer|reading|currently)\b",
        re.IGNORECASE,
    )
    if prose_connectors.search(name):
        return False

    if name[0].islower():
        return False

    words = name.split()
    if len(words) > 8:
        return False

    return True
