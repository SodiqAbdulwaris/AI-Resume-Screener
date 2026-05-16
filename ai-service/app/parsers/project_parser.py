import re

from app.config.parser_config import PROJECT_TECHNOLOGIES

_TOKEN_SPLIT = re.compile(r"[,|]+")
_PROSE_SIGNAL = re.compile(
    r"\b(the|and|or|for|with|using|that|this|which|built|deployed"
    r"|integrated|manages|allows|provides|generates|handles)\b",
    re.IGNORECASE,
)
_BULLET_PREFIX = re.compile(r"^\s*[•\-*▪·]\s*")
_STATUS_SUFFIX = re.compile(
    r"\s*\((?:in progress|android|on hold|ongoing|current)\)\s*$",
    re.IGNORECASE,
)
_INLINE_TECH_SEPARATOR = re.compile(r"\s*[—–|]\s*")
_TECH_LINE_LABEL = re.compile(r"^\s*(?:technologies|tech|stack)\s*:\s*", re.IGNORECASE)


def parse_projects(section_text: str) -> list[dict]:
    lines = [line.strip() for line in section_text.splitlines() if line.strip()]
    if not lines:
        return []

    blocks = split_into_blocks(lines)
    projects = []

    for block in blocks:
        name, inline_tech_line = extract_name_and_inline_tech(block)
        technologies = extract_technologies(block, inline_tech_line)
        if name or technologies:
            projects.append({"name": name, "technologies": technologies})

    return projects


def split_into_blocks(lines: list[str]) -> list[list[str]]:
    blocks: list[list[str]] = []
    current: list[str] = []

    for line in lines:
        if is_project_heading(line) and current:
            blocks.append(current)
            current = []
        current.append(line)

    if current:
        blocks.append(current)

    return blocks


def is_project_heading(line: str) -> bool:
    stripped = _BULLET_PREFIX.sub("", line).strip()
    if not stripped or not stripped[0].isupper():
        return False
    if _TECH_LINE_LABEL.match(stripped):
        return False
    if is_tech_stack_line(stripped):
        return False

    prose_match = _PROSE_SIGNAL.search(stripped)
    if prose_match:
        if prose_match.start() < 40:
            return False
        return True

    if len(stripped.split()) > 8:
        return False

    return True


def extract_name_and_inline_tech(block: list[str]) -> tuple[str | None, str | None]:
    if not block:
        return None, None

    raw = _BULLET_PREFIX.sub("", block[0]).strip()
    raw = _STATUS_SUFFIX.sub("", raw).strip()

    # Handle explicit separator
    sep_match = _INLINE_TECH_SEPARATOR.search(raw)
    if sep_match:
        left = raw[:sep_match.start()].strip()
        right = raw[sep_match.end():].strip()
        if right and is_tech_stack_line(right):
            return left or None, right
        return raw or None, None

    # Trim trailing prose description first, then scan for the split point where
    prose_match = _PROSE_SIGNAL.search(raw)
    if prose_match:
        trimmed = raw[:prose_match.start()].strip(" ,")
    else:
        trimmed = raw

    words = trimmed.split()
    for i in range(2, len(words)):
        name_candidate = " ".join(words[:i]).strip(" ,")
        remainder = " ".join(words[i:]).strip()
        if remainder and is_tech_stack_line(remainder):
            return name_candidate or None, remainder

    return raw or None, None


def extract_technologies(block: list[str], inline_tech_line: str | None) -> list[str]:
    matched: set[str] = set()

    if inline_tech_line:
        matched.update(split_tech_list_into_tokens(inline_tech_line))

    for line in block[1:]:
        cleaned = _BULLET_PREFIX.sub("", line).strip()
        if not cleaned:
            continue

        cleaned = _TECH_LINE_LABEL.sub("", cleaned).strip()
        if not cleaned:
            continue

        if is_tech_stack_line(cleaned):
            matched.update(split_tech_list_into_tokens(cleaned))
        else:
            matched.update(identify_technology_names(cleaned))

    return sorted(matched)


def is_tech_stack_line(line: str) -> bool:
    stripped = _TECH_LINE_LABEL.sub("", line).strip()
    if not _TOKEN_SPLIT.search(stripped):
        return False
    if _PROSE_SIGNAL.search(stripped):
        return False
    tokens = [t.strip() for t in _TOKEN_SPLIT.split(stripped) if t.strip()]
    if not tokens:
        return False
    return all(len(t.split()) <= 3 for t in tokens)


def split_tech_list_into_tokens(line: str) -> list[str]:
    cleaned = _TECH_LINE_LABEL.sub("", line).strip()
    tokens = []
    for raw in _TOKEN_SPLIT.split(cleaned):
        token = raw.strip(" .:;\"'()/").lower()
        if token and len(token) > 1 and not token.isdigit():
            tokens.append(token)
    return tokens


def identify_technology_names(line: str) -> list[str]:
    matched = []
    lowered = line.lower()
    for tech in PROJECT_TECHNOLOGIES:
        if re.search(rf"\b{re.escape(tech)}\b", lowered):
            matched.append(tech)
    return matched