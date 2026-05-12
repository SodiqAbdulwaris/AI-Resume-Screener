import re

DEGREE_PATTERNS = [
    ("phd", r"\b(phd|doctorate)\b"),
    ("master", r"\b(master|msc|mba|meng|m\.sc|m\.eng)\b"),
    ("bachelor", r"\b(bachelor|bsc|beng|b\.sc|b\.eng|hnd)\b"),
    ("olevel", r"\b(a-level|o-level|waec|neco|ssce)\b"),
]
DATE_RANGE_PATTERN = re.compile(
    r"(?P<start>\d{4})\s*[-–]\s*(?P<end>\d{4}|present|in progress|ongoing|current)",
    re.IGNORECASE,
)
YEAR_PATTERN = re.compile(r"\b(19|20)\d{2}\b")
GPA_PATTERN = re.compile(
    r"\b(\d+(?:\.\d+)?/\d+(?:\.\d+)?|\d+(?:\.\d+)?%|first class)\b",
    re.IGNORECASE,
)
STATUS_PATTERN = re.compile(r"\b(in progress|on hold|present|ongoing|current)\b", re.IGNORECASE)
BULLET_PREFIX_PATTERN = re.compile(r"^\s*[o\-•*]\b|^\s*[•*\-]\s*")
COURSEWORK_HINT_PATTERN = re.compile(r"\b(coursework|relevant|gpa|grade)\b", re.IGNORECASE)
TRAILING_DECORATION_PATTERN = re.compile(
    r"\s*(?:\d{4}\s*[-–]\s*(?:\d{4}|in progress|on hold|present|ongoing|current).*)$",
    re.IGNORECASE,
)


def parse_education(section_text: str) -> dict:
    lines = [line.strip() for line in section_text.splitlines() if line.strip()]
    entries = []
    current_entry: dict | None = None
    current_entry_line_count = 0
    highest_rank = -1
    highest_raw = None

    for line in lines:
        if looks_like_institution(line):
            if current_entry is not None:
                entries.append(current_entry)
            current_entry = {
                "institution": clean_institution_name(line),
                "degree": None,
                "start_year": None,
                "end_year": None,
                "gpa": None,
            }
            current_entry_line_count = 0
            continue

        if current_entry is None:
            continue

        current_entry_line_count += 1

        degree_match = detect_degree(line)
        if degree_match and current_entry["degree"] is None:
            current_entry["degree"] = extract_degree_label(line)
            rank = degree_rank(degree_match)
            if rank > highest_rank:
                highest_rank = rank
                highest_raw = degree_match
        elif current_entry["degree"] is None and current_entry_line_count == 1:
            fallback_degree = extract_fallback_degree(line)
            if fallback_degree:
                current_entry["degree"] = fallback_degree

        if current_entry["gpa"] is None:
            gpa_match = GPA_PATTERN.search(line)
            if gpa_match:
                current_entry["gpa"] = gpa_match.group(1)

        start_year, end_year = detect_years(line)
        if start_year is not None and current_entry["start_year"] is None:
            current_entry["start_year"] = start_year
        if end_year is not None or contains_open_ended_marker(line):
            current_entry["end_year"] = end_year

    if current_entry is not None:
        entries.append(current_entry)

    return {
        "entries": entries,
        "highest_raw": highest_raw,
    }


def looks_like_institution(line: str) -> bool:
    lowered = line.lower()
    stripped = line.strip()
    if len(stripped) <= 1 or re.fullmatch(r"[\W_]+", stripped):
        return False
    if BULLET_PREFIX_PATTERN.match(stripped):
        return False
    if COURSEWORK_HINT_PATTERN.search(lowered):
        return False
    if STATUS_PATTERN.search(stripped):
        return False
    if len(stripped) > 60:
        return False
    if stripped.count(",") > 2:
        return False
    if detect_degree(line):
        return False
    if DATE_RANGE_PATTERN.search(line) or GPA_PATTERN.search(line):
        return False
    if YEAR_PATTERN.search(line):
        return False
    return bool(line) and len(line.split()) <= 8 and not lowered.startswith(("gpa", "cgpa"))


def detect_degree(line: str) -> str | None:
    lowered = line.lower()
    for degree_name, pattern in DEGREE_PATTERNS:
        if re.search(pattern, lowered):
            return degree_name
    return None


def extract_degree_label(line: str) -> str:
    stripped = BULLET_PREFIX_PATTERN.sub("", line).strip()
    stripped = GPA_PATTERN.sub("", stripped)
    stripped = TRAILING_DECORATION_PATTERN.sub("", stripped)
    stripped = STATUS_PATTERN.sub("", stripped)
    stripped = re.sub(r"\b(19|20)\d{2}\b", "", stripped)
    stripped = re.sub(r'\(\s*\)', '', stripped).strip()
    stripped = re.sub(r"\s+", " ", stripped).strip(" ,;-")
    stripped = re.sub(r'[\s(]*\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\b.*$', '', stripped, flags=re.IGNORECASE).strip()
    stripped = re.sub(r'\(\s*\)', '', stripped).strip()
    return stripped


def extract_fallback_degree(line: str) -> str | None:
    stripped = line.strip()
    if not stripped:
        return None
    if len(stripped) >= 120:
        return None
    if BULLET_PREFIX_PATTERN.match(stripped):
        return None
    lowered = stripped.lower()
    if any(token in lowered for token in ["coursework", "relevant", "gpa"]):
        return None
    if DATE_RANGE_PATTERN.fullmatch(stripped) or YEAR_PATTERN.fullmatch(stripped):
        return None

    cleaned = extract_degree_label(stripped)
    return cleaned or None

def clean_institution_name(line: str) -> str:
    stripped = re.sub(r'\s+[A-Z][a-z]+$', '', line).strip()
    if "," not in stripped:
        # run strip again in case comma removal exposed a city
        return re.sub(r'\s+[A-Z][a-z]+$', '', stripped).strip()

    head, tail = stripped.split(",", 1)
    tail = tail.strip()
    if not tail:
        # strip trailing city from head too
        return re.sub(r'\s+[A-Z][a-z]+$', '', head).strip()
    if len(tail.split()) >= 4:
        return stripped
    if any(char.isdigit() for char in tail):
        return stripped
    if detect_degree(tail):
        return stripped

    return re.sub(r'\s+[A-Z][a-z]+$', '', head).strip()

def degree_rank(value: str) -> int:
    hierarchy = {
        "olevel": 0,
        "bachelor": 1,
        "master": 2,
        "phd": 3,
    }
    return hierarchy.get(value, -1)


def detect_years(line: str) -> tuple[int | None, int | None]:
    range_match = DATE_RANGE_PATTERN.search(line)
    if range_match:
        start_year = int(range_match.group("start"))
        end_text = range_match.group("end")
        end_year = None if contains_open_ended_marker(end_text) else int(end_text)
        return start_year, end_year

    years = [int(match.group(0)) for match in YEAR_PATTERN.finditer(line)]
    if len(years) >= 2:
        return years[0], years[1]
    if len(years) == 1:
        return years[0], None
    return None, None


def contains_open_ended_marker(value: str) -> bool:
    return bool(re.search(r"\b(present|in progress|ongoing|current)\b", value, re.IGNORECASE))
