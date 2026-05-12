import re

KNOWN_TECHNOLOGIES = {
    "python", "fastapi", "flask", "django", "sqlalchemy", "pydantic",
    "postgresql", "mysql", "sqlite", "mongodb", "supabase", "redis",
    "alembic", "celery", "kafka",
    "react", "vue", "angular", "nextjs", "svelte", "tailwind",
    "html", "css", "javascript", "typescript",
    "kotlin", "java", "swift", "dart", "flutter",
    "node", "nodejs", "express", "graphql", "rest",
    "docker", "kubernetes", "nginx", "git", "github", "gitlab",
    "aws", "gcp", "azure", "firebase", "vercel",
    "pandas", "numpy", "scikit-learn", "tensorflow", "pytorch",
    "rbac", "jwt", "oauth", "websocket",
    "ffmpeg", "yt-dlp", "cli"
}
TOKEN_SPLIT_PATTERN = re.compile(r"[\s,;|/\\()]+")
PROJECT_STATUS_SUFFIX_PATTERN = re.compile(r"\s*\((?:in progress|android|on hold|ongoing|current)\)\s*$", re.IGNORECASE)


def parse_projects(section_text: str) -> list[dict]:
    lines = [line.strip() for line in section_text.splitlines() if line.strip()]
    if not lines:
        return []

    blocks = split_project_blocks(lines)
    projects = []

    for block in blocks:
        name = extract_project_name(block)
        technologies = extract_project_technologies(block)
        if name or technologies:
            projects.append(
                {
                    "name": name,
                    "technologies": technologies,
                }
            )

    return projects


def split_project_blocks(lines: list[str]) -> list[list[str]]:
    blocks = []
    current_block = []

    for line in lines:
        if is_project_heading(line) and current_block:
            blocks.append(current_block)
            current_block = [line]
        else:
            current_block.append(line)

    if current_block:
        blocks.append(current_block)

    return blocks


def is_project_heading(line: str) -> bool:
    stripped = line.lstrip("-* ").strip()
    if len(stripped.split()) > 8:
        return False
    lowered = stripped.lower()
    if any(phrase in lowered for phrase in ["built with", "using", "uses", "tech stack", "technologies"]):
        return False
    return stripped[:1].isupper()


def extract_project_name(block: list[str]) -> str | None:
    if not block:
        return None
    name = block[0].lstrip("-* ").strip()
    name = PROJECT_STATUS_SUFFIX_PATTERN.sub("", name).strip()
    return name or None


def extract_project_technologies(block: list[str]) -> list[str]:
    matched = set()

    for line in block[1:]:
        if len(line.split()) > 30:
            continue
        normalized_line = line.lower()
        tokens = [
            token.strip(" .:;!?-'\"")
            for token in TOKEN_SPLIT_PATTERN.split(normalized_line)
            if token.strip(" .:;!?-'\"")
        ]
        if not tokens:
            continue

        token_set = set(tokens)
        for technology in KNOWN_TECHNOLOGIES:
            if len(technology.split()) > 4:
                continue
            if technology in token_set:
                matched.add(technology)
                continue
            if " " not in technology and technology in normalized_line:
                matched.add(technology)

    return sorted(matched)
