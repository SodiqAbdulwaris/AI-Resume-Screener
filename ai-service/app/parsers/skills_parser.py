import re
from functools import lru_cache

from app.config.parser_config import SKILL_STOP_WORDS as STOP_WORDS
from app.config.parser_config import SKILL_SKIP_TOKENS as SKIP_TOKENS
from app.config.parser_config import get_lang_config

INLINE_LABEL_PATTERN = re.compile(
    r"^([A-Za-z0-9&/()\-\s]{1,40}?)\s*:\s*",
)

BULLET_PREFIX_PATTERN = re.compile(r"^\s*[•\-*▪·]\s*")


@lru_cache(maxsize=None)
def _label_prefixes(lang: str) -> frozenset[str]:
    return frozenset(get_lang_config(lang)["skill_label_prefixes"])


@lru_cache(maxsize=None)
def _skill_section_header_pattern(lang: str) -> re.Pattern:
    # The canonical "skills" section-header words for this language double as
    # the in-body header pattern (a stray repeated "Skills:" line inside the
    # section itself, which section-splitting already isolated).
    aliases = get_lang_config(lang)["section_aliases"]
    headers = [alias for alias, canonical in aliases.items() if canonical == "skills"]
    pattern = "|".join(re.escape(h) for h in sorted(headers, key=len, reverse=True))
    return re.compile(rf"^({pattern})\s*:?\s*$", re.IGNORECASE)


@lru_cache(maxsize=None)
def _known_label_pattern(lang: str) -> re.Pattern:
    labels = _label_prefixes(lang)
    return re.compile(
        "|".join(rf"\b{re.escape(label)}\s*:" for label in sorted(labels, key=len, reverse=True)),
        re.IGNORECASE,
    )


def parse_skills(section_text: str, lang: str = "en") -> list[str]:
    raw_skills: list[str] = []
    seen: set[str] = set()
    header_pattern = _skill_section_header_pattern(lang)

    for line in merge_wrapped_lines(section_text.splitlines(), lang):
        stripped = line.strip()
        if not stripped:
            continue
        if header_pattern.match(stripped):
            continue

        for segment in split_skill_segments(stripped, lang):
            for token in split_skill_tokens(segment):
                normalized = normalize_skill_token(token)
                if normalized and normalized not in seen:
                    seen.add(normalized)
                    raw_skills.append(normalized)

    return sorted(raw_skills)


def merge_wrapped_lines(lines: list[str], lang: str = "en") -> list[str]:
    merged: list[str] = []

    for raw_line in lines:
        line = raw_line.strip()
        if not line:
            continue

        if not merged:
            merged.append(line)
            continue

        if should_merge_skill_line(merged[-1], line, lang):
            merged[-1] = f"{merged[-1]} {line}".strip()
        else:
            merged.append(line)

    return merged


def should_merge_skill_line(previous: str, current: str, lang: str = "en") -> bool:
    if BULLET_PREFIX_PATTERN.match(current):
        return False
    if _skill_section_header_pattern(lang).match(current):
        return False
    if is_labeled_line(current, lang):
        return False
    if is_table_row(current, lang):
        return False
    if previous.rstrip().endswith(","):
        return True
    previous_last = previous.split()[-1].strip(",;:") if previous.split() else ""
    current_first = current.split()[0].strip(",;:") if current.split() else ""
    if previous_last.isupper() and len(previous_last) <= 3 and current_first[:1].isupper():
        return True
    if len(current.split()) <= 4:
        return True
    return False


def split_skill_segments(line: str, lang: str = "en") -> list[str]:
    label_prefixes = _label_prefixes(lang)
    stripped = BULLET_PREFIX_PATTERN.sub("", line).strip()
    if not stripped:
        return []
    if stripped.lower() in label_prefixes or stripped.lower() in SKIP_TOKENS:
        return []

    if is_table_row(stripped, lang):
        label, value = split_table_row(stripped)
        if label and normalize_label(label) in label_prefixes:
            return [value]

    parts = split_collapsed_categories(stripped, lang)
    segments: list[str] = []
    for part in parts:
        cleaned = strip_leading_label(part, lang)
        if cleaned:
            segments.append(cleaned)
    return segments


def is_labeled_line(line: str, lang: str = "en") -> bool:
    match = INLINE_LABEL_PATTERN.match(line)
    if not match:
        return False
    return normalize_label(match.group(1)) in _label_prefixes(lang)


def is_table_row(line: str, lang: str = "en") -> bool:
    label, value = split_table_row(line)
    return bool(label and value and normalize_label(label) in _label_prefixes(lang))


def split_table_row(line: str) -> tuple[str | None, str]:
    match = re.match(r"^([A-Za-z][A-Za-z\s&/]{1,40}?)\s{2,}(.+)$", line)
    if not match:
        return None, line
    label = match.group(1).strip()
    value = match.group(2).strip()
    return label, value


def split_collapsed_categories(line: str, lang: str = "en") -> list[str]:
    matches = list(_known_label_pattern(lang).finditer(line))
    if not matches:
        return [line.strip()]

    segments: list[str] = []
    for index, match in enumerate(matches):
        start = match.start()
        end = matches[index + 1].start() if index + 1 < len(matches) else len(line)
        segment = line[start:end].strip()
        if segment:
            segments.append(segment)

    leading_text = line[:matches[0].start()].strip()
    if leading_text:
        segments.insert(0, leading_text)

    return segments


def split_skill_tokens(text: str) -> list[str]:
    parts = []
    depth = 0
    current: list[str] = []

    for char in text:
        if char == "(":
            depth += 1
            current.append(char)
        elif char == ")":
            depth = max(depth - 1, 0)
            current.append(char)
        elif char in {",", ";"} and depth == 0:
            parts.append("".join(current).strip())
            current = []
        else:
            current.append(char)

    if current:
        parts.append("".join(current).strip())

    return [part for part in parts if part]


def strip_leading_label(value: str, lang: str = "en") -> str:
    match = INLINE_LABEL_PATTERN.match(value)
    if not match:
        return value

    prefix = normalize_label(match.group(1))
    if prefix in _label_prefixes(lang):
        return value[match.end():].strip()

    return value


def normalize_label(value: str) -> str:
    value = value.strip().lower()
    value = re.sub(r"\s+", " ", value)
    return value


def normalize_skill_token(value: str) -> str | None:
    cleaned = value.strip().lower()
    cleaned = re.sub(r"^[\-\u2022*▪·]+\s*", "", cleaned)
    cleaned = re.sub(r"\s+", " ", cleaned).strip(" .:;|")
    cleaned = re.sub(r"\s*\(.*?\)\s*", "", cleaned).strip()
    cleaned = cleaned.strip("()")
    cleaned = re.sub(r"\bvs\s+code\b", "visual studio code", cleaned)

    synonym_map = {
        "js": "javascript",
        "ts": "typescript",
    }
    cleaned = synonym_map.get(cleaned, cleaned)

    if len(cleaned) <= 1:
        return None
    if cleaned in STOP_WORDS:
        return None
    if cleaned in SKIP_TOKENS:
        return None
    if len(cleaned.split()) > 6:
        return None

    return cleaned
