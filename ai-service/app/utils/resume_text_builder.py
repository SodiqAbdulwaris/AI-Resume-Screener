from app.schemas.match import CandidateInput


def build_candidate_text(candidate: CandidateInput) -> str:
    if candidate.raw_text and candidate.raw_text.strip():
        return candidate.raw_text.strip()

    parts = []

    if candidate.full_name:
        parts.append(candidate.full_name)

    if candidate.skills:
        deduped = sorted({s.strip() for s in candidate.skills if s and s.strip()})
        if deduped:
            parts.append("Skills: " + ", ".join(deduped))

    parts.append(f"Years of experience: {candidate.years_experience}")

    if candidate.education_level:
        parts.append(f"Education: {candidate.education_level}")

    return "\n".join(parts)