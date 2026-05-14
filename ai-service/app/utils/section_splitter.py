import re

from app.config.parser_config import SECTION_KEYS, SECTION_ALIASES


# Matches markdown headings
_MARKDOWN_HEADING = re.compile(r"^#{1,6}\s+")

_HEADING_PATTERN = re.compile(
    r"^(?P<title>[A-Za-z][A-Za-z0-9 &/()\-]{1,55})(?::)?\s*$"
)

# Lines that look like headings but are content.
_FALSE_HEADING_PATTERN = re.compile(
    r"\b(and|responsibilities|contributions|achievements|including|such as)\b",
    re.IGNORECASE,
)


def split_into_sections(text: str) -> dict[str, str]:
    sections = {key: "" for key in SECTION_KEYS}
    buffers = {key: [] for key in SECTION_KEYS}

    current_section = "other"

    for raw_line in text.splitlines():
        line = raw_line.strip()
        if not line:
            continue

        heading = classify_heading(line)
        if heading:
            current_section = heading
            continue

        buffers[current_section].append(line)

    for key in SECTION_KEYS:
        sections[key] = "\n".join(buffers[key]).strip()

    return sections


def classify_heading(line: str) -> str | None:
    cleaned = _MARKDOWN_HEADING.sub("", line).strip()

    match = _HEADING_PATTERN.match(cleaned)
    if not match:
        return None

    title = match.group("title").strip()

    if _FALSE_HEADING_PATTERN.search(title):
        return None

    normalized = re.sub(r"\s+", " ", title.lower()).strip()
    return SECTION_ALIASES.get(normalized)