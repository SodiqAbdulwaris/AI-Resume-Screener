import re

_EXPLICIT_URL = re.compile(
    r"https?://[^\s,;|)\"']+",
    re.IGNORECASE,
)
_LINKEDIN = re.compile(
    r"(?:https?://)?(?:www\.)?linkedin\.com/[^\s,;|)\"']+",
    re.IGNORECASE,
)
_GITHUB = re.compile(
    r"(?:https?://)?(?:www\.)?github\.com/[^\s,;|)\"']+",
    re.IGNORECASE,
)

_TRAILING_NOISE = re.compile(r"[.,;)\]\"']+$")

# Patterns that look like urls but not urls
_FALSE_POSITIVE = re.compile(
    r"^[A-Za-z0-9._%+-]+@" 
    r"|node\.js$"            
    r"|next\.js$"
    r"|vue\.js$"
    r"|nuxt\.js$",
    re.IGNORECASE,
)


def extract_links(text: str) -> list[str]:
    found: list[str] = []
    seen: set[str] = set()

    for pattern in (_LINKEDIN, _GITHUB, _EXPLICIT_URL):
        for match in pattern.finditer(text):
            raw = match.group(0)
            normalised = normalise(raw)
            if normalised and normalised not in seen:
                seen.add(normalised)
                found.append(normalised)

    return found


def normalise(raw: str) -> str | None:
    cleaned = _TRAILING_NOISE.sub("", raw.strip())
    if not cleaned:
        return None
    if _FALSE_POSITIVE.match(cleaned):
        return None
    if not cleaned.startswith(("http://", "https://")):
        cleaned = "https://" + cleaned
    return cleaned