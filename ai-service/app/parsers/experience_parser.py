import re
from datetime import datetime

from app.config.parser_config import (
    LEVEL_TOKENS,
    NOUN_TOKENS,
    DOMAIN_TOKENS,
    ROLE_PHRASE_ANCHORS,
    COMPANY_SUFFIX_PATTERN_STR,
    SELF_EMPLOYED_TOKENS,
    EXPERIENCE_ACADEMIC_FILTER_TOKENS,
    EXPERIENCE_DESCRIPTION_STARTERS,
)

current_year = datetime.now().year

MONTHS = r"(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*"

DATE_RANGE_PATTERN = re.compile(
    rf"(?P<start>(?:{MONTHS}\s+)?\d{{4}})\s*[-–]\s*"
    rf"(?P<end>(?:{MONTHS}\s+)?\d{{4}}|present|current|ongoing|in progress)",
    re.IGNORECASE,
)

ROLE_AT_COMPANY_PATTERN = re.compile(
    r"^(?P<role>.+?)\s+at\s+(?P<company>.+)$",
    re.IGNORECASE,
)
ROLE_COMPANY_SEPARATOR = re.compile(r"\s+[—–|·]\s+")
BULLET_LINE_PATTERN = re.compile(r"^\s*[•\-*▪·]\s*")
LOCATION_SUFFIX_PATTERN = re.compile(r",\s*[A-Za-z\s]+(?:,\s*[A-Za-z\s]+)*$")
TIMELINE_QUALIFIER_PATTERN = re.compile(
    r"\s*\((current|present|ongoing|in progress)\)\s*$",
    re.IGNORECASE,
)

COMPANY_SUFFIX_PATTERN = re.compile(COMPANY_SUFFIX_PATTERN_STR, re.IGNORECASE)

SELF_EMPLOYED_PATTERN = re.compile(
    r"\b(" + "|".join(re.escape(t) for t in sorted(SELF_EMPLOYED_TOKENS, key=len, reverse=True)) + r")\b",
    re.IGNORECASE,
)

ACADEMIC_FILTER_PATTERN = re.compile(
    r"\b(" + "|".join(re.escape(t) for t in EXPERIENCE_ACADEMIC_FILTER_TOKENS) + r")\b",
    re.IGNORECASE,
)

# Built from frozenset — sorted longest-first so longer forms match before substrings
DESCRIPTION_STARTERS = re.compile(
    r"^(" + "|".join(
        re.escape(t) for t in sorted(EXPERIENCE_DESCRIPTION_STARTERS, key=len, reverse=True)
    ) + r")\b",
    re.IGNORECASE,
)


# ─────────────────────────────────────────────
# SCORING ENGINE
# ─────────────────────────────────────────────

def calculate_role_score(text: str) -> float:
    if not text or not text.strip():
        return 0.0

    lowered = text.lower().strip()

    if ACADEMIC_FILTER_PATTERN.search(lowered):
        return -4.0
    if DESCRIPTION_STARTERS.match(lowered):
        return -3.0
    if DATE_RANGE_PATTERN.search(text):
        return -5.0

    score = 0.0
    words = [w.strip("()[]{}.,;:") for w in lowered.split() if w.strip("()[]{}.,;:")]

    for phrase in ROLE_PHRASE_ANCHORS:
        if phrase in lowered:
            score += 3.5
            break

    noun_hits = sum(1 for w in words if w in NOUN_TOKENS)
    score += noun_hits * 2.0

    level_hits = sum(1 for w in words if w in LEVEL_TOKENS)
    score += level_hits * 1.5

    domain_hits = sum(1 for w in words if w in DOMAIN_TOKENS)
    score += domain_hits * 1.0

    raw_words = [w.strip("()[]{}.,;:") for w in text.split() if w.strip("()[]{}.,;:")]
    if raw_words:
        casing_density = sum(1 for w in raw_words if w and w[0].isupper()) / len(raw_words)
        if casing_density >= 0.7:
            score += 1.2

    if words and words[-1] in NOUN_TOKENS:
        score += 1.0

    if noun_hits == 0 and score < 3.5:
        score -= 2.0

    if COMPANY_SUFFIX_PATTERN.search(text):
        score -= 2.0

    return score


def calculate_company_score(text: str) -> float:
    if not text or not text.strip():
        return 0.0

    lowered = text.lower().strip()

    if DATE_RANGE_PATTERN.search(text):
        return -5.0

    score = 0.0
    words = [w.strip("()[]{}.,;:") for w in text.split() if w.strip("()[]{}.,;:")]

    if COMPANY_SUFFIX_PATTERN.search(text):
        score += 4.5

    if SELF_EMPLOYED_PATTERN.search(lowered):
        score += 3.0

    if 1 <= len(words) <= 5:
        casing_density = sum(1 for w in words if w and w[0].isupper()) / len(words)
        if casing_density >= 0.8:
            score += 2.0

    role_noun_hits = sum(
        1 for w in [x.strip("()[]{}.,;:").lower() for x in words]
        if w in NOUN_TOKENS or w in LEVEL_TOKENS
    )
    score -= role_noun_hits * 2.5

    return score


# ─────────────────────────────────────────────
# SEMANTIC SPLITTER
# ─────────────────────────────────────────────

def semantic_split(text: str) -> tuple[str | None, str | None]:
    text_clean = LOCATION_SUFFIX_PATTERN.sub("", text).strip()
    text_clean = TIMELINE_QUALIFIER_PATTERN.sub("", text_clean).strip()

    # Extract and strip parenthetical qualifier for clean splitting
    paren_match = re.search(r"\s*(\([^)]*\))", text_clean)
    paren_fragment = paren_match.group(1) if paren_match else ""
    text_for_split = re.sub(r"\s*\([^)]*\)", "", text_clean).strip()

    words = text_for_split.split()
    if len(words) < 2:
        return None, None

    best_score = -999.0
    best_i = -1

    for i in range(1, len(words)):
        left = " ".join(words[:i])
        right = " ".join(words[i:])
        combined = calculate_role_score(left) + calculate_company_score(right)
        if combined > best_score:
            best_score = combined
            best_i = i

    if best_i == -1:
        return None, None

    left = " ".join(words[:best_i])
    right = " ".join(words[best_i:])

    if calculate_role_score(left) < 2.0 or calculate_company_score(right) < 1.5:
        return None, None

    # Reattach qualifier to role
    # After finding left and right from the split:
    if paren_fragment:
        # Check which side the paren was adjacent to in the original
        paren_pos = text_clean.find(paren_fragment)
        split_pos = text_clean.find(right.split()[0]) if right.split() else -1
        if paren_pos >= split_pos:
            right = f"{right} {paren_fragment}"
        else:
            left = f"{left} {paren_fragment}"

    right_clean = right.strip(".,;:—–-()")
    right_words = right_clean.lower().split()
    if right_words and all(
        any(t in w for t in {"self-employed", "self employed", "freelance", "contract", "volunteer"})
        for w in right_words
    ):
        right_clean = "Freelance / Self-Employed"

    right_clean = strip_unbalanced_parens(right_clean)

    return left.strip(), right_clean.strip()

def strip_unbalanced_parens(text: str) -> str:
    # Remove trailing unclosed open paren — "PricewaterhouseCoopers (PwC" → "PricewaterhouseCoopers"
    if text.count("(") > text.count(")"):
        text = re.sub(r"\s*\([^)]*$", "", text).strip()
    # Remove leading orphaned close paren — "Contract) Cowrywise" → "Cowrywise"
    if text.count(")") > text.count("("):
        text = re.sub(r"^[^(]*\)\s*", "", text).strip()
    return text


# ─────────────────────────────────────────────
# PUBLIC API
# ─────────────────────────────────────────────

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
        line.strip()
            .replace("\u200b", "")
            .replace("\u200c", "")
            .replace("\u200d", "")
            .replace("\ufeff", "")
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

        match = DATE_RANGE_PATTERN.search(line)
        if match:
            has_date = True
            if start_year is None:
                start_year, end_year = parse_range(line)

            for text in (line[:match.start()].strip(), line[match.end():].strip()):
                if text:
                    r, c = extract_role_company(text)
                    if r:
                        role_candidates.append(r)
                    if c:
                        company_candidates.append(c)
            continue

        r, c = try_split_role_company(line)
        if r or c:
            if r:
                role_candidates.append(r)
            if c:
                company_candidates.append(c)
            continue

        if is_role_line(line):
            role_candidates.append(line)
            continue

        if is_company_line(line):
            company_candidates.append(line)
            continue

    role = best_role(role_candidates)
    company = best_company(company_candidates)

    if role and company:
        if (calculate_company_score(role) > calculate_role_score(role)
                and calculate_role_score(company) > calculate_company_score(company)):
            role, company = company, role

    if not has_date and start_year is None:
        return None

    return {
        "role": clean_role(role) if role else None,
        "company": clean_company(company) if company else None,
        "start_year": start_year,
        "end_year": end_year,
    }


def best_role(candidates: list[str]) -> str | None:
    if not candidates:
        return None
    return max(candidates, key=lambda x: (
        calculate_role_score(x),
        int(len(x.split()) <= 5),
        -len(x.split()),
    ))


def best_company(candidates: list[str]) -> str | None:
    if not candidates:
        return None
    return max(candidates, key=lambda x: (
        calculate_company_score(x),
        int(len(x.split()) <= 4),
        -len(x.split()),
    ))


# ─────────────────────────────────────────────
# CLASSIFICATION
# ─────────────────────────────────────────────

def classify_line(line: str) -> str:
    if DATE_RANGE_PATTERN.search(line):
        return "date"
    if BULLET_LINE_PATTERN.match(line):
        return "bullet"
    if DESCRIPTION_STARTERS.match(line):
        return "description"

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


def is_role_line(line: str) -> bool:
    if DATE_RANGE_PATTERN.search(line) or DESCRIPTION_STARTERS.match(line):
        return False
    return calculate_role_score(line) >= 2.0


def is_company_line(line: str) -> bool:
    if DATE_RANGE_PATTERN.search(line) or is_role_line(line):
        return False
    return calculate_company_score(line) >= 1.5


# ─────────────────────────────────────────────
# SPLITTING
# ─────────────────────────────────────────────

def try_split_role_company(line: str) -> tuple[str | None, str | None]:
    line = line.strip(" |·—–-")

    match = ROLE_AT_COMPANY_PATTERN.match(line)
    if match:
        r = match.group("role").strip()
        c = match.group("company").strip()
        if is_role_line(r) and calculate_company_score(c) >= 1.5:
            return r, c

    sep = ROLE_COMPANY_SEPARATOR.search(line)
    if sep:
        left = line[:sep.start()].strip()
        right = line[sep.end():].strip()
        if is_role_line(left):
            return left, right.split(",")[0].strip()
        if is_role_line(right):
            return right, left.split(",")[0].strip()

    return None, None


def extract_role_company(text: str) -> tuple[str | None, str | None]:
    if not text:
        return None, None

    r, c = try_split_role_company(text)
    if r or c:
        return r, c

    r, c = semantic_split(text)
    if r or c:
        return r, c

    if is_role_line(text):
        return text, None
    if is_company_line(text):
        return None, text

    return None, None


# ─────────────────────────────────────────────
# CLEANERS
# ─────────────────────────────────────────────

def clean_role(value: str) -> str:
    v = ROLE_COMPANY_SEPARATOR.split(value.strip())[0]
    v = TIMELINE_QUALIFIER_PATTERN.sub("", v)
    v = strip_unbalanced_parens(v)
    return v.strip(".,;:—–-").strip()


def clean_company(value: str) -> str:
    v = re.sub(r"^at\s+", "", value.strip(), flags=re.I)
    v = TIMELINE_QUALIFIER_PATTERN.sub("", v)
    v = v.split(",")[0]
    v = strip_unbalanced_parens(v)
    return v.strip(".,;:—–-()").strip()


# ─────────────────────────────────────────────
# EXPERIENCE CALCULATION
# ─────────────────────────────────────────────

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


# ─────────────────────────────────────────────
# DATE PARSING
# ─────────────────────────────────────────────

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