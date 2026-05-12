from dataclasses import dataclass, field
import re


SECTION_ALIASES = {
    "skills": "skills",
    "technical skills": "skills",
    "core competencies": "skills",
    "competencies": "skills",
    "experience": "experience",
    "work experience": "experience",
    "professional experience": "experience",
    "employment history": "experience",
    "career history": "experience",
    "education": "education",
    "academic background": "education",
    "projects": "projects",
    "personal projects": "projects",
    "certifications": "certifications",
    "certificates": "certifications",
    "links": "links",
    "portfolio": "links",
    "profiles": "links",
    "contact": "contact",
}

HEADING_PATTERN = re.compile(r"^(?P<title>[A-Za-z][A-Za-z &/\-]{1,40})(?::)?$")


@dataclass
class ResumeSection:
    section_name: str
    content: str
    start_line: int
    end_line: int
    lines: list[str] = field(default_factory=list)


@dataclass
class StructuredResume:
    raw_text: str
    lines: list[str]
    header: str
    sections: dict[str, ResumeSection]

    def get_section_text(self, name: str) -> str:
        section = self.sections.get(name)
        return section.content if section else ""


def structure_resume_text(text: str) -> StructuredResume:
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    sections: dict[str, ResumeSection] = {}
    header_lines: list[str] = []

    current_name: str | None = None
    current_lines: list[str] = []
    current_start: int | None = None

    for index, line in enumerate(lines):
        section_name = classify_heading(line)

        if section_name:
            if current_name and current_lines:
                sections[current_name] = ResumeSection(
                    section_name=current_name,
                    content="\n".join(current_lines).strip(),
                    start_line=current_start or 0,
                    end_line=index - 1,
                    lines=current_lines[:],
                )
            current_name = section_name
            current_lines = []
            current_start = index + 1
            continue

        if current_name is None:
            header_lines.append(line)
            continue

        current_lines.append(line)

    if current_name and current_lines:
        sections[current_name] = ResumeSection(
            section_name=current_name,
            content="\n".join(current_lines).strip(),
            start_line=current_start or 0,
            end_line=len(lines) - 1,
            lines=current_lines[:],
        )

    return StructuredResume(
        raw_text=text,
        lines=lines,
        header="\n".join(header_lines).strip(),
        sections=sections,
    )


def classify_heading(line: str) -> str | None:
    match = HEADING_PATTERN.match(line.strip())
    if not match:
        return None

    normalized = re.sub(r"\s+", " ", match.group("title").lower()).strip()
    return SECTION_ALIASES.get(normalized)
