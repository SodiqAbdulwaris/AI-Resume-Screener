import re
from datetime import datetime

current_year = datetime.now().year

MONTHS = r"(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*"

DATE_RANGE_PATTERN = re.compile(
    rf"(?P<start>(?:{MONTHS}\s+)?\d{{4}})\s*[-–]\s*(?P<end>(?:{MONTHS}\s+)?\d{{4}}|present|current|ongoing|in progress)",
    re.IGNORECASE,
)
INLINE_ROLE_PATTERN = re.compile(
    r"(?P<role>.+?)\s+at\s+(?P<company>.+?)\s+\(?(?P<start>(?:[A-Za-z]{3,9}\s+)?\d{4})\s*[-–]\s*(?P<end>(?:[A-Za-z]{3,9}\s+)?\d{4}|present|current|ongoing|in progress)\)?",
    re.IGNORECASE,
)
MONTH_PATTERN = re.compile(
    r"\b(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)\b",
    re.IGNORECASE,
)
ROLE_KEYWORDS = {
    "lead", "engineer", "developer", "manager", "intern",
    "analyst", "designer", "architect", "consultant",
    "coordinator", "head", "director", "officer", "associate",
}


def parse_experience(section_text: str) -> dict:
    lines = [line.strip() for line in section_text.splitlines() if line.strip()]
    entries = []
    seen_signatures = set()

    for index, line in enumerate(lines):
        inline_match = INLINE_ROLE_PATTERN.search(line)
        if inline_match:
            entry = {
                "role": inline_match.group("role").strip(),
                "company": inline_match.group("company").strip(),
                "start_year": parse_year(inline_match.group("start")),
                "end_year": parse_year(inline_match.group("end")),
            }
            signature = (
                entry["role"],
                entry["company"],
                entry["start_year"],
                entry["end_year"],
            )
            if signature not in seen_signatures:
                seen_signatures.add(signature)
                entries.append(entry)
            continue
        
        if not DATE_RANGE_PATTERN.search(line):
            continue

        # print(f"DATE LINE: '{line}'")
        inline_role = extract_inline_role_from_date_line(line)
        # print(f"INLINE ROLE: '{inline_role}'")

        start_year, end_year = parse_range(line)
        company, role = detect_company_and_role(lines, index)

        if inline_role:
            role = inline_role        
        
        if company and DATE_RANGE_PATTERN.search(company):
            company = None
        entry = {
            "role": role,
            "company": company,
            "start_year": start_year,
            "end_year": end_year,
        }
        signature = (role, company, start_year, end_year)
        if signature in seen_signatures:
            continue
        seen_signatures.add(signature)
        entries.append(entry)

    return {
        "entries": entries,
        "total_years": min(calculate_years_of_experience(entries), 30.0),
    }


def calculate_years_of_experience(
    experience_entries: list[dict]
) -> float:
    ranges: list[tuple[int, int]] = []
    has_open_current_range = False

    for exp in experience_entries:
        start_year = exp.get("start_year")
        end_year = exp.get("end_year")
        if start_year is None:
            continue
        if end_year is None:
            end_year = current_year
            has_open_current_range = True
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
    if total == 0.0 and has_open_current_range:
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
    if MONTH_PATTERN.search(lowered):
        year_match = re.search(r"(\d{4})", lowered)
        return int(year_match.group(1)) if year_match else None
    year_match = re.search(r"(\d{4})", lowered)
    return int(year_match.group(1)) if year_match else None



def extract_inline_role_from_date_line(line: str) -> str | None:
    match = DATE_RANGE_PATTERN.search(line)
    if not match:
        # print("NO DATE MATCH")
        return None
    text_before = line[:match.start()].strip()
    print(f"TEXT BEFORE: '{text_before}'")
    if not text_before:
        # print("EMPTY TEXT BEFORE")
        return None
    words = text_before.split()
    print(f"WORD COUNT: {len(words)}")
    if len(words) > 7:
        # print("TOO MANY WORDS")
        return None
    lowered = text_before.lower()
    # print(f"KEYWORD CHECK: {[k for k in ROLE_KEYWORDS if k in lowered]}")
    if any(keyword in lowered for keyword in ROLE_KEYWORDS):
        return text_before
    # print("NO KEYWORD MATCH")
    return None

def detect_adjacent_role(lines: list[str], company_index: int) -> str | None:
    candidates = []
    if company_index - 1 >= 0:
        candidates.append(lines[company_index - 1])
    if company_index + 1 < len(lines):
        candidates.append(lines[company_index + 1])

    for candidate in candidates:
        lowered = candidate.lower()
        if DATE_RANGE_PATTERN.search(candidate):
            continue
        if len(candidate.split()) >= 8:
            continue
        if any(keyword in lowered for keyword in ROLE_KEYWORDS):
            return candidate

    return None


def detect_company_and_role(lines: list[str], date_index: int) -> tuple[str | None, str | None]:
    previous_line = lines[date_index - 1] if date_index - 1 >= 0 else None
    two_above_line = lines[date_index - 2] if date_index - 2 >= 0 else None

    if previous_line and looks_like_role(previous_line):
        return two_above_line, previous_line

    company = previous_line
    role = detect_adjacent_role(lines, date_index - 1) if company else None
    return company, role


def looks_like_role(line: str) -> bool:
    lowered = line.lower()
    if DATE_RANGE_PATTERN.search(line):
        return False
    if len(line.split()) >= 8:
        return False
    return any(keyword in lowered for keyword in ROLE_KEYWORDS)

