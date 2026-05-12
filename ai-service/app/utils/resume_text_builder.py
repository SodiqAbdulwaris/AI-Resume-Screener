from app.schemas.match import CandidateInput


def build_candidate_text(
    candidate: CandidateInput
) -> str:
    parts = []

    if candidate.raw_text is not None and candidate.raw_text.strip():
        parts.append(candidate.raw_text.strip())
        if candidate.skills:
            deduplicated_skills = sorted(
                {
                    skill.strip()
                    for skill in candidate.skills
                    if skill and skill.strip()
                }
            )
            if deduplicated_skills:
                parts.append("Skills: " + ", ".join(deduplicated_skills))
        return "\n".join(parts)

    if candidate.full_name:
        parts.append(candidate.full_name)

    if candidate.skills:
        parts.append(
            "Skills: " +
            ", ".join(candidate.skills)
        )

    parts.append(
        f"Years of experience: "
        f"{candidate.years_experience}"
    )

    if candidate.education_level:
        parts.append(
            f"Education: "
            f"{candidate.education_level}"
        )

    return "\n".join(parts)
