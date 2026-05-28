import re

from app.config.parser_config import DEGREE_PATTERNS, DEGREE_HIERARCHY


DATE_RANGE_PATTERN = re.compile(
    r"(?P<start>\d{4})\s*[-–]\s*(?P<end>\d{4}|present|in progress|ongoing|current)",
    re.IGNORECASE,
)
YEAR_PATTERN = re.compile(r"\b(19|20)\d{2}\b")
GPA_PATTERN = re.compile(
    r"\b(\d+(?:\.\d+)?/\d+(?:\.\d+)?|\d+(?:\.\d+)?%)\b",
    re.IGNORECASE,
)
STATUS_PATTERN = re.compile(
    r"\b(in progress|on hold|present|ongoing|current)\b",
    re.IGNORECASE,
)
BULLET_PREFIX_PATTERN = re.compile(r"^\s*[•*\-]\s*")
TRAILING_DECORATION_PATTERN = re.compile(
    r"\s+(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\s+)?"
    r"\d{4}\s*[-–]\s*"
    r"(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\s+)?"
    r"(?:\d{4}|present|in progress|ongoing|current).*$",
    re.IGNORECASE,
)
GRADE_PATTERN = re.compile(
    r"\s+grade\s*:\s*[\d.,]+.*$",
    re.IGNORECASE,
)

SKIP_LINE_PREFIXES = re.compile(
    r"^(dissertation|thesis|note|advisor|supervisor|relevant coursework|coursework"
    r"|gpa|cgpa|grade|graduated|honours|honors|concentration|major|minor)\s*[:\-]?",
    re.IGNORECASE,
)

CLASSIFICATION_PATTERN = re.compile(
    r"\b(first class|second class|upper division|lower division|with distinction"
    r"|cum laude|magna cum laude|summa cum laude|pass|merit|distinction"
    r"|second class upper|second class lower)\b",
    re.IGNORECASE,
)

INSTITUTION_KEYWORDS = re.compile(
    r"\b(university|université|universität|college|institute|institution"
    r"|school|academy|polytechnic|faculty|department)\b",
    re.IGNORECASE,
)

LOCATION_ONLY_PATTERN = re.compile(
    r"^[A-Za-z\s]+,\s*[A-Za-z\s]+$"
)


def parse_education(section_text: str) -> dict:
    lines = [line.strip() for line in section_text.splitlines() if line.strip()]

    blocks = split_into_blocks(lines)

    entries = []
    highest_rank = -1
    highest_raw = None

    for block in blocks:
        entry = parse_block(block)
        if entry is None:
            continue

        entries.append(entry)

        detected_level = degree_level(entry.get("degree") or "")
        if detected_level is not None:
            rank = degree_rank(detected_level)
            if rank > highest_rank:
                highest_rank = rank
                highest_raw = detected_level

    return {
        "entries": entries,
        "highest_raw": highest_raw,
    }


def split_into_blocks(lines: list[str]) -> list[list[str]]:
    blocks: list[list[str]] = []
    current: list[str] = []

    for line in lines:
        is_degree = is_degree_line(line)
        is_institution = is_institution_line(line)

        if current and (is_degree or is_institution):
            current_has_degree = any(is_degree_line(l) for l in current)
            current_has_institution = any(is_institution_line(l) for l in current)

            if is_degree and current_has_degree:
                blocks.append(current)
                current = []
            elif is_institution and current_has_institution and not current_has_degree:
                blocks.append(current)
                current = []

        current.append(line)

    if current:
        blocks.append(current)

    return blocks


def parse_block(lines: list[str]) -> dict | None:
    degree_line: str | None = None
    institution_line: str | None = None
    start_year: int | None = None
    end_year: int | None = None
    gpa: str | None = None

    for line in lines:
        degree_candidate = is_degree_line(line)
        institution_candidate = is_institution_line(line)

        if is_noise_line(line) and not degree_candidate and not institution_candidate:
            continue

        has_date = DATE_RANGE_PATTERN.search(line) or (
            YEAR_PATTERN.search(line) and not institution_candidate
        )

        if has_date:
            s, e = edu_years(line)
            if s is not None and start_year is None:
                start_year = s
            if e is not None or contains_open_ended_marker(line):
                end_year = e
            if gpa is None:
                gpa_match = GPA_PATTERN.search(line)
                if gpa_match:
                    gpa = gpa_match.group(1)

        if degree_candidate and degree_line is None:
            degree_line = line
            degree_start, degree_end = edu_years(line)
            if degree_start is not None:
                start_year = degree_start
            if degree_end is not None or contains_open_ended_marker(line):
                end_year = degree_end

        if institution_candidate and institution_line is None:
            institution_line = line

        if not has_date and gpa is None:
            gpa_match = GPA_PATTERN.search(line)
            if gpa_match:
                gpa = gpa_match.group(1)

    if degree_line is None and institution_line is None:
        return None

    if degree_line is not None and institution_line is None:
        institution_line = extract_institution_from_degree_line(degree_line)

    return {
        "institution": clean_institution_name(institution_line) if institution_line else None,
        "degree": extract_edu_degree_label(degree_line) if degree_line else None,
        "start_year": start_year,
        "end_year": end_year,
        "gpa": gpa,
    }

def extract_institution_from_degree_line(line: str) -> str | None:
    inst_match = INSTITUTION_KEYWORDS.search(line)
    if not inst_match:
        return None

    cut = inst_match.start()
    preceding = line[:cut].rstrip()

    separator_match = re.search(r"[—–]", preceding)
    if separator_match:
        after_separator = preceding[separator_match.end():]
        # Strip any parenthetical content — "(Distributed Systems)" is degree detail
        after_separator_no_parens = re.sub(r"\([^)]*\)", "", after_separator).strip()
        words_after = after_separator_no_parens.split()

        if words_after:
            # Check if there were parenthetical groups between separator and inst keyword
            has_parens_between = bool(re.search(r"\([^)]*\)", after_separator))
            if has_parens_between:
                # Parentheticals are degree detail — word after them is institution prefix
                cut = line.rindex(words_after[-1])
            else:
                # No parens — word directly after separator is degree subject, not prefix
                cut = inst_match.start()
    else:
        prefix_match = re.search(r"(\b[A-Z][a-z]+)\s*$", preceding)
        if prefix_match:
            cut = prefix_match.start()

    institution_fragment = line[cut:]
    institution_fragment = TRAILING_DECORATION_PATTERN.sub("", institution_fragment).strip()
    if "," in institution_fragment:
        institution_fragment = institution_fragment.split(",", 1)[0].strip()
    return institution_fragment

def is_noise_line(line: str) -> bool:
    if BULLET_PREFIX_PATTERN.match(line):
        return True
    if SKIP_LINE_PREFIXES.match(line):
        return True
    if CLASSIFICATION_PATTERN.search(line):
        return True
    return False


def is_degree_line(line: str) -> bool:
    return degree_level(line) is not None


def is_institution_line(line: str) -> bool:
    if is_noise_line(line):
        return False
    if is_degree_line(line):
        return False
    if DATE_RANGE_PATTERN.search(line):
        return False
    if GPA_PATTERN.search(line) and not INSTITUTION_KEYWORDS.search(line):
        return False
    if INSTITUTION_KEYWORDS.search(line):
        return True
    return False


def clean_institution_name(line: str) -> str:
    cleaned = TRAILING_DECORATION_PATTERN.sub("", line).strip()
    if "," in cleaned:
        institution = cleaned.split(",", 1)[0].strip()
    else:
        institution = cleaned.strip()
    return institution

def extract_edu_degree_label(line: str) -> str:
    cleaned = BULLET_PREFIX_PATTERN.sub("", line).strip()
    cleaned = GPA_PATTERN.sub("", cleaned)
    cleaned = TRAILING_DECORATION_PATTERN.sub("", cleaned)
    cleaned = STATUS_PATTERN.sub("", cleaned)
    cleaned = GRADE_PATTERN.sub("", cleaned)
    cleaned = re.sub(r"\b(19|20)\d{2}\b", "", cleaned)
    cleaned = re.sub(r"\(\s*\)", "", cleaned)
    cleaned = re.sub(
        r"\b(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\b",
        "",
        cleaned,
        flags=re.IGNORECASE,
    )

    inst_match = INSTITUTION_KEYWORDS.search(cleaned)
    if inst_match:
        before_inst = cleaned[:inst_match.start()].rstrip()
        before_inst = re.sub(r'\s+[A-Z][A-Za-z]+$', '', before_inst)
        cleaned = before_inst

    cleaned = re.sub(r"\s+", " ", cleaned).strip(" ,;-–—")
    if cleaned.startswith("(") and ")" not in cleaned:
        cleaned = cleaned.lstrip("(").strip()
    return cleaned

def degree_level(line: str) -> str | None:
    lowered = line.lower()
    for degree_name, pattern in DEGREE_PATTERNS:
        if re.search(pattern, lowered, re.IGNORECASE):
            return degree_name
    return None


def degree_rank(value: str) -> int:
    return DEGREE_HIERARCHY.get(value, -1)


def edu_years(line: str) -> tuple[int | None, int | None]:
    range_match = DATE_RANGE_PATTERN.search(line)
    if range_match:
        start_year = int(range_match.group("start"))
        end_text = range_match.group("end")
        end_year = None if contains_open_ended_marker(end_text) else int(end_text)
        return start_year, end_year

    years = [int(m.group(0)) for m in YEAR_PATTERN.finditer(line)]
    if len(years) >= 2:
        return years[0], years[1]
    if len(years) == 1:
        return years[0], None
    return None, None


def contains_open_ended_marker(value: str) -> bool:
    return bool(
        re.search(r"\b(present|in progress|ongoing|current)\b", value, re.IGNORECASE)
    )
