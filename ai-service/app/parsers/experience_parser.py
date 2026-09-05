import re
from dataclasses import dataclass
from datetime import datetime
from functools import lru_cache

from app.config.parser_config import get_lang_config

current_year = datetime.now().year

BULLET_LINE_PATTERN = re.compile(r"^\s*[•\-*▪·]\s*")
LOCATION_SUFFIX_PATTERN = re.compile(r",\s*[A-Za-z\s]+(?:,\s*[A-Za-z\s]+)*$")


@dataclass(frozen=True)
class _LangPatterns:
    date_range: re.Pattern
    role_at_company: re.Pattern
    role_company_separator: re.Pattern
    timeline_qualifier: re.Pattern
    company_suffix: re.Pattern
    self_employed: re.Pattern
    academic_filter: re.Pattern
    description_starters: re.Pattern
    self_employed_tokens: frozenset[str]
    present_words: frozenset[str]
    role_phrase_anchors: frozenset[str]
    noun_tokens: frozenset[str]
    level_tokens: frozenset[str]
    domain_tokens: frozenset[str]


@lru_cache(maxsize=None)
def _patterns(lang: str) -> _LangPatterns:
    cfg = get_lang_config(lang)
    months = cfg["months"]
    present_words = frozenset(w.lower() for w in cfg["present_words"])
    present_alt = "|".join(re.escape(w) for w in sorted(present_words, key=len, reverse=True))

    date_range = re.compile(
        rf"(?P<start>(?:{months}\s+)?\d{{4}})\s*[-–]\s*"
        rf"(?P<end>(?:{months}\s+)?\d{{4}}|{present_alt})",
        re.IGNORECASE,
    )
    role_at_company = re.compile(
        rf"^(?P<role>.+?)\s+{re.escape(cfg['role_at_company_word'])}\s+(?P<company>.+)$",
        re.IGNORECASE,
    )
    role_company_separator = re.compile(cfg["role_company_separator"])
    timeline_qualifier = re.compile(rf"\s*\(({present_alt})\)\s*$", re.IGNORECASE)
    company_suffix = re.compile(cfg["company_suffix_pattern_str"], re.IGNORECASE)

    self_employed_tokens = frozenset(t.lower() for t in cfg["self_employed_tokens"])
    self_employed = re.compile(
        r"\b(" + "|".join(re.escape(t) for t in sorted(self_employed_tokens, key=len, reverse=True)) + r")\b",
        re.IGNORECASE,
    )
    academic_filter = re.compile(
        r"\b(" + "|".join(re.escape(t) for t in cfg["academic_filter_tokens"]) + r")\b",
        re.IGNORECASE,
    )
    description_starters = re.compile(
        r"^(" + "|".join(re.escape(t) for t in sorted(cfg["description_starters"], key=len, reverse=True)) + r")\b",
        re.IGNORECASE,
    )

    return _LangPatterns(
        date_range=date_range,
        role_at_company=role_at_company,
        role_company_separator=role_company_separator,
        timeline_qualifier=timeline_qualifier,
        company_suffix=company_suffix,
        self_employed=self_employed,
        academic_filter=academic_filter,
        description_starters=description_starters,
        self_employed_tokens=self_employed_tokens,
        present_words=present_words,
        role_phrase_anchors=frozenset(cfg["role_phrase_anchors"]),
        noun_tokens=frozenset(cfg["noun_tokens"]),
        level_tokens=frozenset(cfg["level_tokens"]),
        domain_tokens=frozenset(cfg["domain_tokens"]),
    )


# ─────────────────────────────────────────────
# SCORING ENGINE
# ─────────────────────────────────────────────

def calculate_role_score(text: str, lang: str = "en") -> float:
    if not text or not text.strip():
        return 0.0

    p = _patterns(lang)
    lowered = text.lower().strip()

    if p.academic_filter.search(lowered):
        return -4.0
    if p.description_starters.match(lowered):
        return -3.0
    if p.date_range.search(text):
        return -5.0

    score = 0.0
    words = [w.strip("()[]{}.,;:") for w in lowered.split() if w.strip("()[]{}.,;:")]

    for phrase in p.role_phrase_anchors:
        if phrase in lowered:
            score += 3.5
            break

    noun_hits = sum(1 for w in words if w in p.noun_tokens)
    score += noun_hits * 2.0

    level_hits = sum(1 for w in words if w in p.level_tokens)
    score += level_hits * 1.5

    domain_hits = sum(1 for w in words if w in p.domain_tokens)
    score += domain_hits * 1.0

    raw_words = [w.strip("()[]{}.,;:") for w in text.split() if w.strip("()[]{}.,;:")]
    if raw_words:
        casing_density = sum(1 for w in raw_words if w and w[0].isupper()) / len(raw_words)
        if casing_density >= 0.7:
            score += 1.2

    if words and words[-1] in p.noun_tokens:
        score += 1.0

    if noun_hits == 0 and score < 3.5:
        score -= 2.0

    if p.company_suffix.search(text):
        score -= 2.0

    return score


def calculate_company_score(text: str, lang: str = "en") -> float:
    if not text or not text.strip():
        return 0.0

    p = _patterns(lang)
    lowered = text.lower().strip()

    if p.date_range.search(text):
        return -5.0

    score = 0.0
    words = [w.strip("()[]{}.,;:") for w in text.split() if w.strip("()[]{}.,;:")]

    if p.company_suffix.search(text):
        score += 4.5

    if p.self_employed.search(lowered):
        score += 3.0

    if 1 <= len(words) <= 5:
        casing_density = sum(1 for w in words if w and w[0].isupper()) / len(words)
        if casing_density >= 0.8:
            score += 2.0

    role_noun_hits = sum(
        1 for w in [x.strip("()[]{}.,;:").lower() for x in words]
        if w in p.noun_tokens or w in p.level_tokens
    )
    score -= role_noun_hits * 2.5

    return score


# ─────────────────────────────────────────────
# SEMANTIC SPLITTER
# ─────────────────────────────────────────────

def semantic_split(text: str, lang: str = "en") -> tuple[str | None, str | None]:
    p = _patterns(lang)
    text_clean = LOCATION_SUFFIX_PATTERN.sub("", text).strip()
    text_clean = p.timeline_qualifier.sub("", text_clean).strip()

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
        combined = calculate_role_score(left, lang) + calculate_company_score(right, lang)
        if combined > best_score:
            best_score = combined
            best_i = i

    if best_i == -1:
        return None, None

    left = " ".join(words[:best_i])
    right = " ".join(words[best_i:])

    if calculate_role_score(left, lang) < 2.0 or calculate_company_score(right, lang) < 1.5:
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
        any(t in w for t in p.self_employed_tokens) for w in right_words
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

def parse_experience(section_text: str, lang: str = "en") -> dict:
    lines = clean_lines(section_text)
    blocks = split_into_blocks(lines, lang)

    entries = []
    seen = set()

    for block in blocks:
        entry = parse_block(block, lang)
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
            .replace("​", "")
            .replace("‌", "")
            .replace("‍", "")
            .replace("﻿", "")
        for line in text.splitlines()
        if line.strip()
    ]


def split_into_blocks(lines: list[str], lang: str = "en") -> list[list[str]]:
    blocks, current = [], []

    for line in lines:
        kind = classify_line(line, lang)
        is_date = kind == "date"
        is_header = kind in {"role_header", "company_header", "inline_header"}

        if current and is_date and block_has_date(current, lang):
            blocks.append(current)
            current = []
        elif current and is_header and should_split(current, kind, lang):
            blocks.append(current)
            current = []

        current.append(line)

    if current:
        blocks.append(current)

    return blocks


def block_has_date(block: list[str], lang: str = "en") -> bool:
    date_range = _patterns(lang).date_range
    return any(date_range.search(l) for l in block)


def should_split(current: list[str], new_kind: str, lang: str = "en") -> bool:
    if block_has_date(current, lang):
        return True
    if new_kind == "inline_header":
        return True

    has_role = any(classify_line(l, lang) == "role_header" for l in current)
    has_company = any(classify_line(l, lang) == "company_header" for l in current)
    if has_role and has_company:
        return True

    return any(classify_line(l, lang) == new_kind for l in current)


def parse_block(lines: list[str], lang: str = "en") -> dict | None:
    date_range = _patterns(lang).date_range
    role_candidates = []
    company_candidates = []
    start_year = None
    end_year = None
    has_date = False

    for line in lines:
        kind = classify_line(line, lang)

        if kind == "bullet":
            continue

        match = date_range.search(line)
        if match:
            has_date = True
            if start_year is None:
                start_year, end_year = parse_range(line, lang)

            for text in (line[:match.start()].strip(), line[match.end():].strip()):
                if text:
                    r, c = extract_role_company(text, lang)
                    if r:
                        role_candidates.append(r)
                    if c:
                        company_candidates.append(c)
            continue

        r, c = try_split_role_company(line, lang)
        if r or c:
            if r:
                role_candidates.append(r)
            if c:
                company_candidates.append(c)
            continue

        if is_role_line(line, lang):
            role_candidates.append(line)
            continue

        if is_company_line(line, lang):
            company_candidates.append(line)
            continue

    role = best_role(role_candidates, lang)
    company = best_company(company_candidates, lang)

    if role and company:
        if (calculate_company_score(role, lang) > calculate_role_score(role, lang)
                and calculate_role_score(company, lang) > calculate_company_score(company, lang)):
            role, company = company, role

    if not has_date and start_year is None:
        return None

    return {
        "role": clean_role(role, lang) if role else None,
        "company": clean_company(company, lang) if company else None,
        "start_year": start_year,
        "end_year": end_year,
    }


def best_role(candidates: list[str], lang: str = "en") -> str | None:
    if not candidates:
        return None
    return max(candidates, key=lambda x: (
        calculate_role_score(x, lang),
        int(len(x.split()) <= 5),
        -len(x.split()),
    ))


def best_company(candidates: list[str], lang: str = "en") -> str | None:
    if not candidates:
        return None
    return max(candidates, key=lambda x: (
        calculate_company_score(x, lang),
        int(len(x.split()) <= 4),
        -len(x.split()),
    ))


# ─────────────────────────────────────────────
# CLASSIFICATION
# ─────────────────────────────────────────────

def classify_line(line: str, lang: str = "en") -> str:
    p = _patterns(lang)
    if p.date_range.search(line):
        return "date"
    if BULLET_LINE_PATTERN.match(line):
        return "bullet"
    if p.description_starters.match(line):
        return "description"

    kind = detect_header_kind(line, lang)
    if kind:
        return f"{kind}_header"

    if is_description(line, lang):
        return "description"

    return "other"


def detect_header_kind(line: str, lang: str = "en") -> str | None:
    r, c = try_split_role_company(line, lang)
    if r and c:
        return "inline"
    if is_role_line(line, lang):
        return "role"
    if is_company_line(line, lang):
        return "company"
    return None


def is_description(line: str, lang: str = "en") -> bool:
    return len(line.split()) > 10 or bool(_patterns(lang).description_starters.match(line))


def is_role_line(line: str, lang: str = "en") -> bool:
    p = _patterns(lang)
    if p.date_range.search(line) or p.description_starters.match(line):
        return False
    return calculate_role_score(line, lang) >= 2.0


def is_company_line(line: str, lang: str = "en") -> bool:
    if _patterns(lang).date_range.search(line) or is_role_line(line, lang):
        return False
    return calculate_company_score(line, lang) >= 1.5


# ─────────────────────────────────────────────
# SPLITTING
# ─────────────────────────────────────────────

def try_split_role_company(line: str, lang: str = "en") -> tuple[str | None, str | None]:
    p = _patterns(lang)
    line = line.strip(" |·—–-")

    match = p.role_at_company.match(line)
    if match:
        r = match.group("role").strip()
        c = match.group("company").strip()
        if is_role_line(r, lang) and calculate_company_score(c, lang) >= 1.5:
            return r, c

    sep = p.role_company_separator.search(line)
    if sep:
        left = line[:sep.start()].strip()
        right = line[sep.end():].strip()
        if is_role_line(left, lang):
            return left, right.split(",")[0].strip()
        if is_role_line(right, lang):
            return right, left.split(",")[0].strip()

    return None, None


def extract_role_company(text: str, lang: str = "en") -> tuple[str | None, str | None]:
    if not text:
        return None, None

    r, c = try_split_role_company(text, lang)
    if r or c:
        return r, c

    r, c = semantic_split(text, lang)
    if r or c:
        return r, c

    if is_role_line(text, lang):
        return text, None
    if is_company_line(text, lang):
        return None, text

    return None, None


# ─────────────────────────────────────────────
# CLEANERS
# ─────────────────────────────────────────────

def clean_role(value: str, lang: str = "en") -> str:
    p = _patterns(lang)
    v = p.role_company_separator.split(value.strip())[0]
    v = p.timeline_qualifier.sub("", v)
    v = strip_unbalanced_parens(v)
    return v.strip(".,;:—–-").strip()


def clean_company(value: str, lang: str = "en") -> str:
    p = _patterns(lang)
    v = re.sub(rf"^{re.escape(get_lang_config(lang)['role_at_company_word'])}\s+", "", value.strip(), flags=re.I)
    v = p.timeline_qualifier.sub("", v)
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

def parse_range(value: str, lang: str = "en") -> tuple[int | None, int | None]:
    p = _patterns(lang)
    m = p.date_range.search(value)
    if not m:
        return None, None
    return parse_year(m.group("start"), lang), parse_year(m.group("end"), lang)


def parse_year(value: str, lang: str = "en") -> int | None:
    if not value:
        return None
    v = value.lower().strip()
    if v in _patterns(lang).present_words:
        return None
    m = re.search(r"\d{4}", v)
    return int(m.group()) if m else None


def contains_open_ended_marker(value: str, lang: str = "en") -> bool:
    present_words = _patterns(lang).present_words
    lowered = value.lower()
    return any(re.search(rf"\b{re.escape(w)}\b", lowered) for w in present_words)
