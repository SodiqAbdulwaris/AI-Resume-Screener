import re

from app.config.parser_config import SKILL_STOP_WORDS as STOP_WORDS
from app.config.parser_config import SKILL_SKIP_TOKENS as SKIP_TOKENS

SKILL_SECTION_HEADER_PATTERN = re.compile(
    r"^(skills|technical skills|core competencies|technologies|areas of expertise)\s*:?\s*$",
    re.IGNORECASE,
)

INLINE_LABEL_PATTERN = re.compile(
    r"^([A-Za-z0-9&/()\-\s]{1,40}?)\s*:\s*",
)

BULLET_PREFIX_PATTERN = re.compile(r"^\s*[•\-*▪·]\s*")

LABEL_PREFIXES = {
    "languages", "programming languages", "other", "tools", "frameworks", "libraries",
    "frameworks & libraries", "libraries/frameworks", "architecture", "design",
    "architecture & design",
    "frontend", "backend", "databases", "database",
    "web", "mobile",
    "devops", "cloud", "cloud platforms", "platforms", "containers & orchestration",
    "containers", "orchestration", "infrastructure as code",
    "ci/cd", "monitoring & observability", "monitoring", "observability",
    "networking", "security",
    "primary", "secondary", "tertiary",
    "testing", "test",
    "scripting", "scripting languages",
    "ml frameworks", "ml/dl", "ml / dl",
    "data tools", "data", "big data",
    "nlp", "mlops",
    "offensive security", "defensive / soc", "defensive",
    "cloud security", "devsecops", "forensics",
    "soft skills", "concepts", "version control",
    "ios frameworks", "cross-platform", "tooling",
    "observability tools",
    "tools & devops", "tools & technologies",
}

KNOWN_LABEL_PATTERN = re.compile(
    "|".join(
        rf"\b{re.escape(label)}\s*:"
        for label in sorted(LABEL_PREFIXES, key=len, reverse=True)
    ),
    re.IGNORECASE,
)


def parse_skills(section_text: str) -> list[str]:
    raw_skills: list[str] = []
    seen: set[str] = set()

    for line in merge_wrapped_lines(section_text.splitlines()):
        stripped = line.strip()
        if not stripped:
            continue
        if SKILL_SECTION_HEADER_PATTERN.match(stripped):
            continue

        for segment in split_skill_segments(stripped):
            for token in split_skill_tokens(segment):
                normalized = normalize_skill_token(token)
                if normalized and normalized not in seen:
                    seen.add(normalized)
                    raw_skills.append(normalized)

    return sorted(raw_skills)


def merge_wrapped_lines(lines: list[str]) -> list[str]:
    merged: list[str] = []

    for raw_line in lines:
        line = raw_line.strip()
        if not line:
            continue

        if not merged:
            merged.append(line)
            continue

        if should_merge_skill_line(merged[-1], line):
            merged[-1] = f"{merged[-1]} {line}".strip()
        else:
            merged.append(line)

    return merged


def should_merge_skill_line(previous: str, current: str) -> bool:
    if BULLET_PREFIX_PATTERN.match(current):
        return False
    if SKILL_SECTION_HEADER_PATTERN.match(current):
        return False
    if is_labeled_line(current):
        return False
    if is_table_row(current):
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


def split_skill_segments(line: str) -> list[str]:
    stripped = BULLET_PREFIX_PATTERN.sub("", line).strip()
    if not stripped:
        return []
    if stripped.lower() in LABEL_PREFIXES or stripped.lower() in SKIP_TOKENS:
        return []

    if is_table_row(stripped):
        label, value = split_table_row(stripped)
        if label and normalize_label(label) in LABEL_PREFIXES:
            return [value]

    parts = split_collapsed_categories(stripped)
    segments: list[str] = []
    for part in parts:
        cleaned = strip_leading_label(part)
        if cleaned:
            segments.append(cleaned)
    return segments


def is_labeled_line(line: str) -> bool:
    match = INLINE_LABEL_PATTERN.match(line)
    if not match:
        return False
    return normalize_label(match.group(1)) in LABEL_PREFIXES


def is_table_row(line: str) -> bool:
    label, value = split_table_row(line)
    return bool(label and value and normalize_label(label) in LABEL_PREFIXES)


def split_table_row(line: str) -> tuple[str | None, str]:
    match = re.match(r"^([A-Za-z][A-Za-z\s&/]{1,40}?)\s{2,}(.+)$", line)
    if not match:
        return None, line
    label = match.group(1).strip()
    value = match.group(2).strip()
    return label, value


def split_collapsed_categories(line: str) -> list[str]:
    matches = list(KNOWN_LABEL_PATTERN.finditer(line))
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


def strip_leading_label(value: str) -> str:
    match = INLINE_LABEL_PATTERN.match(value)
    if not match:
        return value

    prefix = normalize_label(match.group(1))
    if prefix in LABEL_PREFIXES:
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
