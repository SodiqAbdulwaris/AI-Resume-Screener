import re


CERT_SPLIT_PATTERN = re.compile(r",|;|\||\u2022")
ISSUER_SPLIT_PATTERN = re.compile(r"\s*(?:[-–—]| by )\s*", re.IGNORECASE)


def parse_certifications(section_text: str) -> list[str]:
    certifications = []

    for line in section_text.splitlines():
        stripped = line.strip()
        if not stripped:
            continue

        stripped = re.sub(r"^\d+[\).\s]+", "", stripped)
        stripped = stripped.lstrip("-* ").strip()

        parts = [part.strip() for part in CERT_SPLIT_PATTERN.split(stripped) if part.strip()]
        for part in parts:
            name = strip_issuer_metadata(part)
            if name:
                certifications.append(name)

    return certifications


def strip_issuer_metadata(value: str) -> str:
    parts = [part.strip() for part in ISSUER_SPLIT_PATTERN.split(value) if part.strip()]
    return parts[0] if parts else ""
