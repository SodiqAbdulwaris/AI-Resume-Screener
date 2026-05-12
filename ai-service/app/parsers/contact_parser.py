import re

EMAIL_PATTERN = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")
PHONE_PATTERN = re.compile(r"(?:\+?\d[\d()\-\s]{8,}\d)")
URL_PATTERN = re.compile(r"(https?://|www\.|linkedin\.com|github\.com)", re.IGNORECASE)
LOCATION_PATTERN = re.compile(r"^[A-Za-z .'-]+,\s*[A-Za-z .'-]+$")
JOB_TITLE_HINTS = {
    "engineer",
    "developer",
    "manager",
    "analyst",
    "designer",
    "scientist",
    "consultant",
    "specialist",
    "intern",
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
            found_location = extract_location_from_line(line)
            if found_location:
                result["location"] = found_location

    result["full_name"] = extract_best_name(lines)
    if result["location"] is None:
            for line in lines[:5]:
                found_location = extract_location_from_line(line)
                if found_location:
                    result["location"] = found_location
                    break
    return result


def extract_best_name(lines: list[str]) -> str | None:
    candidates = []
    for line in lines[:5]:
        if not looks_like_name_candidate(line):
            continue
        candidates.append(line)

    if not candidates:
        return None

    candidates.sort(key=lambda value: name_score(value), reverse=True)
    return candidates[0]


def looks_like_name_candidate(line: str) -> bool:
    lowered = line.lower().strip()
    words = line.split()

    if not line or len(words) == 0 or len(words) > 5:
        return False
    if EMAIL_PATTERN.search(line) or PHONE_PATTERN.search(line) or URL_PATTERN.search(line):
        return False
    if any(char.isdigit() for char in line):
        return False
    if any(title in lowered for title in JOB_TITLE_HINTS):
        return False
    if "," in line or "|" in line:
        return False

    capitalized_words = sum(1 for word in words if word[:1].isupper())
    return capitalized_words >= max(1, len(words) - 1)


def name_score(line: str) -> tuple[int, int]:
    words = line.split()
    capitalized_words = sum(1 for word in words if word[:1].isupper())
    return (capitalized_words, -len(words))


def looks_like_location(line: str, allow_guess: bool = True) -> bool:
    lowered = line.lower()
    if EMAIL_PATTERN.search(line) or PHONE_PATTERN.search(line) or URL_PATTERN.search(line):
        return False
    if any(title in lowered for title in JOB_TITLE_HINTS):
        return False
    if "@" in line or "http" in lowered or "+" in line:
        return False
    if "," not in line or len(line.split()) >= 6:
        return False
    if not allow_guess:
        return False
    return bool(LOCATION_PATTERN.match(line))

def extract_location_from_line(line: str) -> str | None:
    segments = [seg.strip() for seg in line.split("|")]
    for segment in segments:
        if LOCATION_PATTERN.match(segment) and len(segment.split()) < 6:
            lowered = segment.lower()
            if "@" not in segment and "http" not in lowered and "+" not in segment:
                return segment.strip()
    return None