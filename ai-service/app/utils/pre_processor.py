# app/utils/pre_processor.py

import re
import unicodedata
from rapidfuzz import fuzz

from app.config.parser_config import get_lang_config

# Sections
_INLINE_SPLIT_SECTIONS = {"skills", "experience", "education", "projects", "certifications", "summary"}
_CONTEXT_SENSITIVE_CANONICALS = {"other", "languages"}

# Constants
FUZZY_MATCH_THRESHOLD = 80
MARKER_FORMAT = "##SECTION:{}##"
UNKNOWN_MARKER = MARKER_FORMAT.format("unknown")

# Body signal patterns
_ZERO_WIDTH = re.compile(r"[\u200b\u200c\u200d\ufeff]")
_LOCATION = re.compile(r"^[A-Za-z\s\-\.]+,\s*[A-Za-z\s\-\.]+(?:,\s*[A-Za-z\s\-\.]+)?$")
_BULLET = re.compile(r"^[\-\•\*\–\—]\s+")
_EMAIL = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")
_PHONE = re.compile(r"(?:\+?\d[\d()\-\s]{8,}\d)")
_DATE_RANGE = re.compile(r"\b(19|20)\d{2}\s*[-–—]\s*((19|20)\d{2}|present|current|now|ongoing)\b", re.IGNORECASE)
_URL = re.compile(r"(https?://|www\.|linkedin\.com|github\.com)", re.IGNORECASE)
_ENDS_WITH_PUNCT = re.compile(r"[.!?;]$")
_TRAILING_COLON = re.compile(r":$")
_INLINE_LABEL = re.compile(r"^([A-Za-z][A-Za-z0-9 &/()\-]{1,40}):\s+(.+)$")

# Max character length for ALL CAPS heading candidate
_MAX_HEADING_LENGTH = 60


# Clean raw extracted text and return lines.
# - Strip zero-width characters
# - Normalise unicode to NFC
# - Normalise whitespace
# - Strip trailing colons from short lines
# - Split inline section labels onto separate lines
def clean(text: str, lang: str = "en") -> list[str]:
    section_aliases = get_lang_config(lang)["section_aliases"]
    text = _ZERO_WIDTH.sub("", text)
    text = unicodedata.normalize("NFC", text)

    lines = []
    for raw_line in text.splitlines():
        line = re.sub(r"[ \t]+", " ", raw_line).strip()
        if not line:
            continue

        # Split inline section labels
        inline_match = _INLINE_LABEL.match(line)
        if inline_match:
            label = inline_match.group(1).strip()
            content = inline_match.group(2).strip()
            normalized_label = re.sub(r"\s+", " ", label.lower()).strip()
            if section_aliases.get(normalized_label) in _INLINE_SPLIT_SECTIONS:
                lines.append(label)
                lines.append(content)
                continue

        # Strip trailing colons from short lines (heading candidates)
        if _TRAILING_COLON.search(line) and len(line) <= _MAX_HEADING_LENGTH:
            line = line[:-1].strip()

        lines.append(line)

    return lines


# Return True if the line has any strong body signal.
# Body signals disqualify a line from being a heading candidate.
def is_body(line: str) -> bool:
    if _BULLET.match(line):
        return True
    if _EMAIL.search(line):
        return True
    if _PHONE.search(line):
        return True
    if _DATE_RANGE.search(line):
        return True
    if _URL.search(line):
        return True
    if _ENDS_WITH_PUNCT.search(line): return True
    if line.count(",") >= 2:
        return True
    if _LOCATION.match(line):
        return True
    if len(line) > _MAX_HEADING_LENGTH:
        return True
    return False

# Attempt exact then fuzzy match against the language's section aliases.
# Returns the canonical section name or None.
def alias_match(line: str, lang: str = "en") -> str | None:
    section_aliases = get_lang_config(lang)["section_aliases"]
    normalized = re.sub(r"\s+", " ", line.lower()).strip()
    normalized = re.sub(r"\s*\(.*?\)\s*$", "", normalized).strip()

    # Exact match
    if normalized in section_aliases:
        return section_aliases[normalized]

    # Fuzzy match — only run if line is short enough to be a heading
    if len(line) <= _MAX_HEADING_LENGTH:
        best_score = 0
        best_match = None
        for alias in section_aliases:
            score = fuzz.ratio(normalized, alias)
            if score > best_score:
                best_score = score
                best_match = alias
        if best_score >= FUZZY_MATCH_THRESHOLD:
            return section_aliases[best_match]

    return None


# Classify a single line.
# Returns tag, canonical_section | None
# Tags can either be heading_strong, heading_weak or body
def classify_line(line: str, lang: str = "en") -> tuple[str, str | None]:
    if is_body(line):
        return ("body", None)

    canonical = alias_match(line, lang)
    if canonical:
        return ("heading_strong", canonical)

    if line.isupper() and len(line) <= _MAX_HEADING_LENGTH:
        return ("body", None)

    words = line.split()
    if len(words) <= 6:
        return ("heading_weak", None)

    return ("body", None)

# Go through classified lines and infer section boundaries.
# Rules:
#   - heading_weak always becomes body after heading_strong is ascertained
#   - heading_strong confirmed when followed by at least one non-strong line
#   - Everything before the first heading_strong is the contact section
#   - Unresolvable blocks are marked as UNKNOWN
def infer_sections(lines: list[str], lang: str = "en") -> list[tuple[str, list[str]]]:
    classified = [classify_line(line, lang) for line in lines]

    sections: list[tuple[str, list[str]]] = []
    current_label: str | None = None
    current_lines: list[str] = []
    contact_injected = False

    for i, (line, (tag, canonical)) in enumerate(zip(lines, classified)):

        if tag == "heading_strong":
            has_content = any(
                classified[j][0] != "heading_strong"
                for j in range(i + 1, len(classified))
                if j < len(classified)
            )

            # Demote context-sensitive headings to body when inside a skills block
            if canonical in _CONTEXT_SENSITIVE_CANONICALS and current_label == "skills":
                current_lines.append(line)
                continue

            # Inject contact section positionally before first heading_strong
            if not contact_injected:
                contact_injected = True
                if current_lines:
                    sections.append(("contact", current_lines))
                current_lines = []

            # Save previous section
            if current_label is not None:
                sections.append((current_label, current_lines))
                current_lines = []

            current_label = canonical if has_content else "unknown"
        
        else:
            # heading_weak and body both become content lines
            current_lines.append(line)

    # Flush final section
    if current_lines:
        label = current_label if current_label is not None else "unknown"
        sections.append((label, current_lines))

    return sections


def inject_markers(sections: list[tuple[str, list[str]]]) -> str:
    parts = []
    for label, lines in sections:
        marker = MARKER_FORMAT.format(label)
        block = "\n".join(lines)
        parts.append(f"{marker}\n{block}")
    return "\n".join(parts)


# Public API
# Preprocess raw extracted resume text to return 
# marked_text with section markers and clean_text without section markers
def preprocess(text: str, lang: str = "en") -> tuple[str, str]:
    lines = clean(text, lang)
    clean_text = "\n".join(lines)

    sections = infer_sections(lines, lang)
    marked_text = inject_markers(sections)

    return marked_text, clean_text