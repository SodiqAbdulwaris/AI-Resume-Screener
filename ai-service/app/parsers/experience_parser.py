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

ROLE_AT_COMPANY_PATTERN = re.compile(r"^(?P<role>.+?)\s+at\s+(?P<company>.+)$", re.IGNORECASE)
ROLE_COMPANY_SEPARATOR = re.compile(r"\s+[—–\-|·]\s+")
BULLET_LINE_PATTERN = re.compile(r"^\s*[•\-*▪·]\s*")

DESCRIPTION_STARTERS = re.compile(
    r"^(built|design(?:ed)?|develop(?:ed)?|led|manage(?:d)?|implemented|created|worked"
    r"|collaborated|maintained|improved|reduced|increased|migrated"
    r"|integrated|automated|delivered|deployed|established|conducted"
    r"|performed|produced|wrote|architected|launched|owned|drove"
    r"|contributed|fix(?:ed)?|supervised)\b",
    re.IGNORECASE,
)

COMPANY_KEYWORDS = re.compile(
    r"\b(ltd|limited|inc|llc|gmbh|plc|corp|corporation|group|bank|health"
    r"|technologies|solutions|consulting|studio|agency|systems|services"
    r"|university|college|institute)\b",
    re.IGNORECASE,
)


def parse_experience(section_text: str) -> dict:
    lines = clean_lines(section_text)
    blocks = split_into_blocks(lines)

    entries = []
    seen = set()

    for block in blocks:
        entry = parse_block(block)
        if not entry:
            continue

        sig = (entry["role"], entry["company"], entry["start_year"], entry["end_year"])
        if sig in seen:
            continue

        seen.add(sig)
        entries.append(entry)

    return {
        "entries": entries,
        "total_years": min(calculate_years_of_experience(entries), 30.0),
    }



def clean_lines(text: str) -> list[str]:
    return [
        line.strip().replace("\u200b", "").replace("\u200c", "").replace("\u200d", "").replace("\ufeff", "")
        for line in text.splitlines()
        if line.strip()
    ]



def split_into_blocks(lines: list[str]) -> list[list[str]]:
    blocks, current = [], []

    for line in lines:
        kind = classify_line(line)

        is_date = kind == "date"
        is_header = kind in {"role_header", "company_header", "inline_header"}

        if current and is_date and block_has_date(current):
            blocks.append(current)
            current = []

        elif current and is_header and should_split(current, kind):
            blocks.append(current)
            current = []

        current.append(line)

    if current:
        blocks.append(current)

    return blocks


def block_has_date(block: list[str]) -> bool:
    return any(DATE_RANGE_PATTERN.search(l) for l in block)


def should_split(current: list[str], new_kind: str) -> bool:
    if block_has_date(current):
        return True
    if new_kind == "inline_header":
        return True

    # Fix: Prevent cross-block bleed if an entire candidate pair has already been found
    has_role = any(classify_line(l) == "role_header" for l in current)
    has_company = any(classify_line(l) == "company_header" for l in current)
    if has_role and has_company:
        return True

    return any(classify_line(l) == new_kind for l in current)



def parse_block(lines: list[str]) -> dict | None:
    role_candidates = []
    company_candidates = []
    start_year = None
    end_year = None
    has_date = False

    for line in lines:
        kind = classify_line(line)

        if kind == "bullet":
            continue

        # DATE HANDLING (Fix: Harvests tokens from both left and right flanks safely)
        match = DATE_RANGE_PATTERN.search(line)
        if match:
            has_date = True

            if start_year is None:
                start_year, end_year = parse_range(line)

            left_text = line[:match.start()].strip()
            right_text = line[match.end():].strip()

            for text in (left_text, right_text):
                if text:
                    r, c = extract_role_company(text)
                    if r: role_candidates.append(r)
                    if c: company_candidates.append(c)
            continue

        # INLINE PARSE
        r, c = try_split_role_company(line)
        if r or c:
            if r: role_candidates.append(r)
            if c: company_candidates.append(c)
            continue

        # FALLBACK CLASSIFICATION
        if is_role_line(line):
            role_candidates.append(line)
            continue

        if is_company_line(line):
            company_candidates.append(line)
            continue

    role = best(role_candidates, is_role_line)
    company = best(company_candidates, is_company_line)

    # safety swap fix
    if role and company:
        if is_company_line(role) and not is_company_line(company):
            role, company = company, role

    if not has_date and start_year is None:
        return None

    return {
        "role": clean_role(role) if role else None,
        "company": clean_company(company) if company else None,
        "start_year": start_year,
        "end_year": end_year,
    }


# SELECTION
def best(candidates: list[str], validator) -> str | None:
    if not candidates:
        return None

    def score(x: str):
        return (
            int(validator(x)),
            int(len(x.split()) <= 5),
            int(role_ends_with_keyword(x) if validator == is_role_line else 0),
            -len(x.split()),
        )

    return max(candidates, key=score)


# CLASSIFICATION

def classify_line(line: str) -> str:
    if DATE_RANGE_PATTERN.search(line):
        return "date"
    if BULLET_LINE_PATTERN.match(line):
        return "bullet"

    # Fix: Run contextual header checks before checking generic description token lengths
    kind = detect_header_kind(line)
    if kind:
        return f"{kind}_header"

    if is_description(line):
        return "description"

    return "other"


def detect_header_kind(line: str) -> str | None:
    r, c = try_split_role_company(line)
    if r and c:
        return "inline"
    if is_role_line(line):
        return "role"
    if is_company_line(line):
        return "company"
    return None


def is_description(line: str) -> bool:
    return len(line.split()) > 10 or bool(DESCRIPTION_STARTERS.match(line))


# ROLE / COMPANY DETECTION
def is_role_line(line: str) -> bool:
    if DATE_RANGE_PATTERN.search(line) or len(line.split()) > 8 or DESCRIPTION_STARTERS.match(line):
        return False

    text = line.lower()
    return any(k in text for k in EXPERIENCE_ROLE_KEYWORDS)


def is_company_line(line: str) -> bool:
    if DATE_RANGE_PATTERN.search(line) or len(line.split()) > 8 or is_role_line(line):
        return False

    if COMPANY_KEYWORDS.search(line):
        return True

    words = [w.strip("()[]{}.,;:") for w in line.split() if w.strip("()[]{}.,;:")]
    if 1 <= len(words) <= 6:
        return (sum(1 for w in words if w and w[0].isupper()) / len(words)) >= 0.6

    return False


def role_ends_with_keyword(value: str) -> bool:
    words = value.lower().split()
    return bool(words) and words[-1] in EXPERIENCE_ROLE_KEYWORDS


# SPLITTING HELPERS
def try_split_role_company(line: str) -> tuple[str | None, str | None]:
    line = line.strip(" |·—–-")

    match = ROLE_AT_COMPANY_PATTERN.match(line)
    if match:
        r = match.group("role").strip()
        c = match.group("company").strip()
        if is_role_line(r) and is_company_line(c):
            return r, c

    sep = ROLE_COMPANY_SEPARATOR.search(line)
    if sep:
        left = line[:sep.start()].strip()
        right = line[sep.end():].strip()

        # Fix: Trust structural separator tokens to guide fallback extraction paths
        if is_role_line(left):
            return left, right
        if is_role_line(right):
            return right, left

    return None, None


def extract_role_company(text: str) -> tuple[str | None, str | None]:
    if not text:
        return None, None

    r, c = try_split_role_company(text)
    if r or c:
        return r, c

    if is_role_line(text):
        return text, None

    if is_company_line(text):
        return None, text

    return None, None


# CLEANERS
def clean_role(value: str) -> str:
    v = ROLE_COMPANY_SEPARATOR.split(value.strip())[0]
    return v.strip(".,;:—–-").strip()


def clean_company(value: str) -> str:
    v = re.sub(r"^at\s+", "", value.strip(), flags=re.I)
    v = v.split(",")[0]
    return v.strip(".,;:—–-()").strip()


# EXPERIENCE CALCULATION
def calculate_years_of_experience(entries: list[dict]) -> float:
    ranges = []
    for e in entries:
        s = e.get("start_year")
        t = e.get("end_year") or current_year
        if s is None:
            continue
        ranges.append((min(s, t), max(s, t)))

    if not ranges:
        return 0.0

    ranges.sort()
    merged = [ranges[0]]

    for s, e in ranges[1:]:
        ps, pe = merged[-1]
        if s <= pe + 1:
            merged[-1] = (ps, max(pe, e))
        else:
            merged.append((s, e))

    return float(sum((e - s) + 1 for s, e in merged))


# DATE PARSING
def parse_range(value: str) -> tuple[int | None, int | None]:
    m = DATE_RANGE_PATTERN.search(value)
    if not m:
        return None, None
    return parse_year(m.group("start")), parse_year(m.group("end"))


def parse_year(value: str) -> int | None:
    if not value:
        return None

    v = value.lower().strip()
    if v in {"present", "current", "ongoing", "in progress"}:
        return None

    m = re.search(r"\d{4}", v)
    return int(m.group()) if m else None