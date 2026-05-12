import re
from dataclasses import dataclass

URL_PATTERN = re.compile(
    r"(?:(?:https?://)?(?:www\.)?(?:linkedin\.com/[^\s,;|)]+|github\.com/[^\s,;|)]+|[A-Za-z0-9.-]+\.[A-Za-z]{2,}(?:/[^\s,;|)]+)?))",
    re.IGNORECASE,
)


@dataclass
class LinksParseResult:
    links: list[str]
    confidence: float


def extract_links(text: str) -> LinksParseResult:
    links = []
    seen = set()

    for match in URL_PATTERN.finditer(text):
        normalized = normalize_link(match.group(0))
        if not normalized or normalized in seen:
            continue
        seen.add(normalized)
        links.append(normalized)

    return LinksParseResult(links=links, confidence=0.8 if links else 0.0)


def normalize_link(link: str) -> str | None:
    cleaned = link.strip().rstrip(".,);")
    if "@" in cleaned and "http" not in cleaned and cleaned.count(".") == 1:
        return None
    if not cleaned.startswith(("http://", "https://")):
        cleaned = f"https://{cleaned}"
    return cleaned
