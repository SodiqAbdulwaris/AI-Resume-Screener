import re

EMAIL_PATTERN = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")
PHONE_PATTERN = re.compile(r"(?:\+?\d[\d()\-\s]{8,}\d)")
URL_PATTERN = re.compile(r"(https?://|www\.|linkedin\.com|github\.com)", re.IGNORECASE)


LOCATION_PATTERN = re.compile(
    r"^[A-Za-z][A-Za-z .'\-]+(?:,\s*[A-Za-z][A-Za-z .'\-]+){1,2}$"
)

HONORIFIC_PATTERN = re.compile(
    r"^(dr\.?|mr\.?|mrs\.?|ms\.?|miss\.?|prof\.?|rev\.?|eng\.?)\s+",
    re.IGNORECASE,
)

CONTACT_SEPARATOR_PATTERN = re.compile(r"\s*[|·•]\s*")

JOB_TITLE_HINTS = {
    "engineer", "developer", "manager", "analyst", "designer",
    "scientist", "consultant", "specialist", "intern", "director",
    "architect", "officer", "lead", "head", "senior", "junior",
}


def parse_contact(section_text: str) -> dict:
    lines = [line.strip(" -|") for line in section_text.splitlines() if line.strip()]
    result = {
        "full_name": None,
        "email": None,
        "phone": None,
        "location": None,
    }

    for line in lines:
        if result["email"] is None:
            email_match = EMAIL_PATTERN.search(line)
            if email_match:
                result["email"] = email_match.group(0)

        if result["phone"] is None:
            phone_match = PHONE_PATTERN.search(line)
            if phone_match:
                result["phone"] = phone_match.group(0).strip()

        if result["location"] is None:
            result["location"] = extract_location(line)

    result["full_name"] = extract_best_name(lines)

    return result



def extract_location(line: str) -> str | None:
    segments = CONTACT_SEPARATOR_PATTERN.split(line)
    if len(segments) == 1:
        segments = [line]

    for segment in segments:
        candidate = segment.strip(" -|·•")
        if not candidate:
            continue
        if is_location(candidate):
            return candidate

    return None


def is_location(text: str) -> bool:
    if not text:
        return False
    if EMAIL_PATTERN.search(text):
        return False
    if PHONE_PATTERN.search(text):
        return False
    if URL_PATTERN.search(text):
        return False
    if any(char.isdigit() for char in text):
        return False
    lowered = text.lower()
    if any(title in lowered for title in JOB_TITLE_HINTS):
        return False
    return bool(LOCATION_PATTERN.match(text.strip()))


def extract_best_name(lines: list[str]) -> str | None:
    candidates = []
    for line in lines[:5]:
        if not looks_like_name(line):
            continue
        candidates.append(line)

    if not candidates:
        return None

    candidates.sort(key=name_score, reverse=True)
    best = candidates[0]

    best = HONORIFIC_PATTERN.sub("", best).strip()

    return best or None


def looks_like_name(line: str) -> bool:
    words = line.split()

    if not words or len(words) > 5:
        return False
    if EMAIL_PATTERN.search(line) or PHONE_PATTERN.search(line) or URL_PATTERN.search(line):
        return False
    if any(char.isdigit() for char in line):
        return False

    lowered = line.lower()
    if any(title in lowered for title in JOB_TITLE_HINTS):
        return False
    if "," in line or "|" in line or "·" in line:
        return False

    capitalised = sum(1 for w in words if w[:1].isupper())
    return capitalised >= max(1, len(words) - 1)


def name_score(line: str) -> tuple[int, int]:
    words = line.split()
    capitalised = sum(1 for w in words if w[:1].isupper())
    return (capitalised, -len(words))