import re
from typing import List, Dict, Tuple, Optional

from app.config.parser_config import PROJECT_TECHNOLOGIES


BULLET_PREFIX = re.compile(r"^\s*[•\-*▪·]\s*")
STATUS_SUFFIX = re.compile(
    r"\s*\((?:in progress|android|on hold|ongoing|current|production|side project)\)\s*$",
    re.IGNORECASE,
)

PARENTHETICAL_LABEL = re.compile(
    r"\s*\((?:in progress|android|on hold|ongoing|current|production|side project|open source)\)",
    re.IGNORECASE,
)

INLINE_TECH_SEPARATOR = re.compile(r"\s*[—–|]\s*")
TECH_LABEL = re.compile(
    r"^\s*(technologies|tech|stack)\s*:\s*", 
    re.IGNORECASE,
    )

METRIC_LINE = re.compile(
    r"\b\d[\d,]*\s*(downloads|users|installs|stars)\b", 
    re.IGNORECASE,
    )

PROSE_SIGNAL = re.compile(
    r"\b(built|developed|deployed|integrated|implemented|designed|managed|using|with|for)\b",
    re.IGNORECASE,
)

TOKEN_SPLIT = re.compile(
    r"\s*,\s*|\s*\|\s*"
    )


TECH_REGEX = {
    tech: re.compile(rf"\b{re.escape(tech)}\b", re.IGNORECASE)
    for tech in PROJECT_TECHNOLOGIES
}


def parse_projects(section_text: str) -> List[Dict]:
    lines = [l.strip() for l in section_text.splitlines() if l.strip()]
    if not lines:
        return []

    blocks = split_into_blocks(lines)

    return [parse_block(block) for block in blocks if block]


def split_into_blocks(lines: List[str]) -> List[List[str]]:
    blocks, current = [], []

    for line in lines:
        if is_project_heading(line) and current:
            blocks.append(current)
            current = []
        current.append(line)

    if current:
        blocks.append(current)

    return blocks


def is_project_heading(line: str) -> bool:
    cleaned = clean_line(line)
    if not cleaned:
        return False
    if TECH_LABEL.match(cleaned):
        return False
    if PROSE_SIGNAL.search(cleaned) and not INLINE_TECH_SEPARATOR.search(cleaned):
        return False
    return True


def parse_block(block: List[str]) -> Dict:
    title, inline_tech = extract_title(block[0])

    techs = set()
    if inline_tech:
        techs.update(split_tech(inline_tech))

    for line in block[1:]: # Skip [0], it's already handled
        kind, cleaned = classify(line)
        if kind == "tech":
            techs.update(split_tech(cleaned))
        elif kind == "unknown":
            techs.update(match_known_tech(cleaned))

    return {
        "name": title,
        "technologies": sorted(techs)
    }

def classify(line: str) -> Tuple[str, str]:
    cleaned = clean_line(line)

    if METRIC_LINE.search(cleaned):
        return "metric", cleaned

    if is_tech_line(cleaned):
        return "tech", cleaned

    if TECH_LABEL.match(cleaned):
        return "tech", cleaned

    return "unknown", cleaned


def is_tech_line(line: str) -> bool:
    cleaned = TECH_LABEL.sub("", line).strip()

    if not TOKEN_SPLIT.search(cleaned):
        return False

    if PROSE_SIGNAL.search(cleaned):
        return False

    tokens = [t for t in TOKEN_SPLIT.split(cleaned) if t.strip()]
    return bool(tokens) and all(len(t.split()) <= 5 for t in tokens)


def extract_title(line: str) -> Tuple[Optional[str], Optional[str]]:
    cleaned = clean_line(line)
    cleaned = STATUS_SUFFIX.sub("", cleaned).strip()

    if INLINE_TECH_SEPARATOR.search(cleaned):
        left, right = split_inline(cleaned)
        if is_tech_line(right) and not METRIC_LINE.search(right):  # ← add metric guard
            return clean_title(left), right

    match = TECH_LABEL.search(cleaned)
    if match:
        return clean_title(cleaned[:match.start()]), cleaned[match.start():]

    return extract_inline_stack(cleaned)

def split_inline(text: str) -> Tuple[str, str]:
    parts = INLINE_TECH_SEPARATOR.split(text, maxsplit=1)
    return (parts[0].strip(), parts[1].strip()) if len(parts) == 2 else (text, "")

def extract_inline_stack(raw: str) -> Tuple[Optional[str], Optional[str]]:
    cleaned = PARENTHETICAL_LABEL.sub("", raw).strip()
    words = cleaned.split()

    for i in range(1, len(words)):
        candidate = " ".join(words[i:])

        if "," not in candidate:
            continue

        # first token before the first comma must be short (1-2 words max)
        first_token = candidate.split(",")[0].strip()
        if len(first_token.split()) > 2:
            continue

        tokens = [t.strip() for t in TOKEN_SPLIT.split(candidate) if t.strip()]
        if not tokens:
            continue

        valid = []
        for token in tokens:
            token_clean = token.lower()
            if PROSE_SIGNAL.search(token_clean):
                break
            if match_known_tech(token_clean) or len(token.split()) <= 3:
                valid.append(token_clean)
            else:
                break
            
        

        if valid:
            title = " ".join(words[:i]).strip()
            return clean_title(title), ", ".join(valid)

    return clean_title(cleaned), None

def clean_title(text: str) -> str:
    text = BULLET_PREFIX.sub("", text).strip()
    text = STATUS_SUFFIX.sub("", text).strip()
    return re.sub(r"[\s|—–-]+$", "", text).strip() or None



def split_tech(line: str) -> List[str]:
    cleaned = TECH_LABEL.sub("", line).strip()        
    
        
    return [
        t.strip(" .:;\"'()/").lower()
        for t in TOKEN_SPLIT.split(cleaned)
        if t
        and not t.isdigit()
        and not METRIC_LINE.search(t)
    ]


def match_known_tech(line: str) -> List[str]:
    matched = []

    for tech, pattern in TECH_REGEX.items():
        if pattern.search(line):
            matched.append(tech)

    return matched


def clean_line(line: str) -> str:
    return BULLET_PREFIX.sub("", line).strip()
