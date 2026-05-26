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
_GENERIC_DOMAIN = re.compile(
    r"(?<![A-Za-z0-9._%+-])(?:https?://)?(?:www\.)?(?:[A-Za-z0-9-]+\.)+[A-Za-z]{2,}(?:/[^\s,;|)\"']*)?",
    re.IGNORECASE,
)

_TRAILING_NOISE = re.compile(r"[.,;)\]\"']+$")
_LEADING_LABEL = re.compile(
    r"^(?:github|linkedin|portfolio|blog|website|site)\s*:\s*",
    re.IGNORECASE,
)

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

    for pattern in (_LINKEDIN, _GITHUB, _EXPLICIT_URL, _GENERIC_DOMAIN):
        for match in pattern.finditer(text):
            if pattern is _GENERIC_DOMAIN and is_email_adjacent_match(text, match.start(), match.end()):
                continue
            raw = match.group(0)
            normalised = normalise(raw)
            if normalised and normalised not in seen:
                seen.add(normalised)
                found.append(normalised)

    return found


def normalise(raw: str) -> str | None:
    cleaned = _LEADING_LABEL.sub("", raw.strip())
    cleaned = _TRAILING_NOISE.sub("", cleaned)
    if not cleaned:
        return None
    if _FALSE_POSITIVE.match(cleaned):
        return None
    if not cleaned.startswith(("http://", "https://")):
        cleaned = "https://" + cleaned
    return cleaned


def is_email_adjacent_match(text: str, start: int, end: int) -> bool:
    if start > 0 and text[start - 1] == "@":
        return True
    if start > 0 and text[start - 1].isalnum():
        email_start = max(0, start - 64)
        if "@" in text[email_start:start]:
            return True
    if end < len(text) and text[end:end + 1] == "@":
        return True
    return False
