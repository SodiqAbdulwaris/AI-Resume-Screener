import re
from datetime import datetime

from app.config.parser_config import EXPERIENCE_ROLE_KEYWORDS

current_year = datetime.now().year

MONTHS = r"(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*"

DATE_RANGE_PATTERN = re.compile(
    rf"(?P<start>(?:{MONTHS}\s+)?\d{{4}})\s*[-–]\s*"
    rf"(?P<end>(?:{MONTHS}\s+)?\d{{4}}|present|current|ongoing|in progress)",
    re.IGNORECASE,
)

MONTH_PATTERN = re.compile(
    r"\b(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)\b",
    re.IGNORECASE,
)

ROLE_COMPANY_SEPARATOR = re.compile(r"\s+[—–|·]\s+")

BULLET_LINE_PATTERN = re.compile(r"^\s*[•\-*▪·]\s*")

COMPANY_KEYWORDS = re.compile(
    r"\b(ltd|limited|inc|llc|gmbh|plc|corp|corporation|group|bank|health"
    r"|technologies|solutions|consulting|studio|agency|systems|services"
    r"|university|college|institute)\b",
    re.IGNORECASE,
)

_TRAILING_LOCATION = re.compile(
    r",\s*[A-Za-z][A-Za-z\s]+(?:,\s*[A-Za-z][A-Za-z\s]+)?\s*$"
)


def parse_experience(section_text: str) -> dict:
    lines = [
        line.strip().replace("\u200b", "").replace("\u200c", "").replace("\u200d", "").replace("\ufeff", "")
        for line in section_text.splitlines()
        if line.strip()
    ]

    blocks = split_into_blocks(lines)

    entries = []
    seen_signatures: set[tuple] = set()

    for block in blocks:
        entry = _parse_block(block)
        if entry is None:
            continue

        signature = (
            entry["role"],
            entry["company"],
            entry["start_year"],
            entry["end_year"],
        )
        if signature in seen_signatures:
            continue

        seen_signatures.add(signature)
        entries.append(entry)

    return {
        "entries": entries,
        "total_years": min(calculate_years_of_experience(entries), 30.0),
    }



def split_into_blocks(lines: list[str]) -> list[list[str]]:
    blocks: list[list[str]] = []
    current: list[str] = []

    for line in lines:
        has_date = bool(DATE_RANGE_PATTERN.search(line))
        is_header = not has_date and bool(try_split_role_and_company(line)[0])

        if current:
            if has_date and block_has_date(current):
                # New date seen and current block already has one — start new block
                blocks.append(current)
                current = []
            elif is_header and (block_has_date(current) or block_has_header(current)):
                # New role/company header seen and current block already has content
                # that looks like a job entry — start new block
                blocks.append(current)
                current = []

        current.append(line)

    if current:
        blocks.append(current)

    return blocks


def block_has_date(block: list[str]) -> bool:
    return any(DATE_RANGE_PATTERN.search(line) for line in block)


def block_has_header(block: list[str]) -> bool:
    return any(bool(try_split_role_and_company(line)[0]) for line in block)

def block_has_date(block: list[str]) -> bool:
    return any(DATE_RANGE_PATTERN.search(line) for line in block)


def _parse_block(lines: list[str]) -> dict | None:
    
    
    
    role: str | None = None
    company: str | None = None
    start_year: int | None = None
    end_year: int | None = None
    
    # print(f"[DEBUG] block lines: {lines}")

    for line in lines:
        if BULLET_LINE_PATTERN.match(line):
            continue
        if _is_description_line(line):
            continue

        date_match = DATE_RANGE_PATTERN.search(line)
        if date_match:
            if start_year is None:
                start_year, end_year = parse_range(line)

            text_before_date = line[:date_match.start()].strip()
            if text_before_date and (role is None or company is None):
                extracted_role, extracted_company = extract_role_and_company_from_text(text_before_date)
                if extracted_role and role is None:
                    role = extracted_role
                if extracted_company and company is None:
                    company = extracted_company
            continue

        if role is None or company is None:
            split_role, split_company = try_split_role_and_company(line)
            if split_role and role is None:
                role = split_role
            if split_company and company is None:
                company = split_company
            if split_role or split_company:
                continue

        if role is None and is_role_line(line):
            role = line
            continue

        if company is None and is_company_line(line):
            company = line
            continue

    if start_year is None:
        return None
    

    return {
        "role": clean_role(role) if role else None,
        "company": clean_company(company) if company else None,
        "start_year": start_year,
        "end_year": end_year,
    }


def _is_description_line(line: str) -> bool:
    words = line.split()
    if len(words) > 10:
        return True
    description_starters = re.compile(
        r"^(built|designed|developed|led|managed|implemented|created|worked"
        r"|collaborated|maintained|improved|reduced|increased|migrated"
        r"|integrated|automated|delivered|deployed|established|conducted"
        r"|performed|produced|wrote|architected|launched|owned|drove)\b",
        re.IGNORECASE,
    )
    if description_starters.match(line):
        return True
    return False


def is_role_line(line: str) -> bool:
    if DATE_RANGE_PATTERN.search(line):
        return False
    if len(line.split()) > 8:
        return False
    lowered = line.lower()
    return any(keyword in lowered for keyword in EXPERIENCE_ROLE_KEYWORDS)


def is_company_line(line: str) -> bool:
    if DATE_RANGE_PATTERN.search(line):
        return False
    if len(line.split()) > 8:
        return False
    if is_role_line(line):
        return False
    if COMPANY_KEYWORDS.search(line):
        return True
    words = line.split()
    if 1 <= len(words) <= 6:
        title_case_words = sum(1 for w in words if w and w[0].isupper())
        if title_case_words >= len(words) * 0.6:
            return True
    return False


def try_split_role_and_company(line: str) -> tuple[str | None, str | None]:
    # Handle explicit separator
    sep_match = ROLE_COMPANY_SEPARATOR.search(line)
    if sep_match:
        left = line[:sep_match.start()].strip()
        right = line[sep_match.end():].strip()
        right_no_loc = _TRAILING_LOCATION.sub("", right).strip()
        company_candidate = right_no_loc.split(",")[0].strip() if right_no_loc else None
        if is_role_line(left):
            return left, company_candidate
        if is_role_line(right.split(",")[0]):
            return right.split(",")[0].strip(), left
        return None, None

    # Strip trailing location first, then scan every split point from left to right,
    line_no_loc = _TRAILING_LOCATION.sub("", line).strip()
    words_no_loc = line_no_loc.split()

    best_split: tuple[str | None, str | None] = (None, None)
    for split_at in range(2, len(words_no_loc)):
        role_candidate = " ".join(words_no_loc[:split_at])
        company_candidate = " ".join(words_no_loc[split_at:]).strip("(),.")
        if is_role_line(role_candidate) and company_candidate:
            best_split = (role_candidate, company_candidate or None)

    return best_split


def extract_role_and_company_from_text(text: str) -> tuple[str | None, str | None]:
    if not text:
        return None, None

    role, company = try_split_role_and_company(text)
    if role:
        return role, company

    if is_role_line(text):
        return text, None

    return None, None


def clean_role(value: str) -> str:
    cleaned = value.strip()
    cleaned = ROLE_COMPANY_SEPARATOR.split(cleaned)[0].strip()
    cleaned = cleaned.strip(".,;:—–-")
    return cleaned


def clean_company(value: str) -> str:
    cleaned = value.strip()
    if "," in cleaned:
        cleaned = cleaned.split(",")[0].strip()
    cleaned = cleaned.strip(".,;:—–-()")
    return cleaned


def calculate_years_of_experience(entries: list[dict]) -> float:
    ranges: list[tuple[int, int]] = []
    has_open_range = False

    for exp in entries:
        start_year = exp.get("start_year")
        end_year = exp.get("end_year")
        if start_year is None:
            continue
        if end_year is None:
            end_year = current_year
            has_open_range = True
        start = min(start_year, end_year)
        end = max(start_year, end_year)
        ranges.append((start, end))

    if not ranges:
        return 0.0

    ranges.sort()
    merged = [ranges[0]]

    for start, end in ranges[1:]:
        last_start, last_end = merged[-1]
        if start <= last_end:
            merged[-1] = (last_start, max(last_end, end))
        else:
            merged.append((start, end))

    total = sum(end - start for start, end in merged)

    if total == 0.0 and has_open_range:
        return 0.5

    return max(float(total), 0.0)


def parse_range(value: str) -> tuple[int | None, int | None]:
    match = DATE_RANGE_PATTERN.search(value)
    if not match:
        return None, None
    return parse_year(match.group("start")), parse_year(match.group("end"))


def parse_year(value: str) -> int | None:
    lowered = value.strip().lower()
    if lowered in {"present", "current", "ongoing", "in progress"}:
        return None
    year_match = re.search(r"(\d{4})", lowered)
    return int(year_match.group(1)) if year_match else None


def contains_open_ended_marker(value: str) -> bool:
    return bool(
        re.search(r"\b(present|in progress|ongoing|current)\b", value, re.IGNORECASE)
    )