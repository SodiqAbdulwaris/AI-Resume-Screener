
def build_explanations(
    candidate,
    matched_skills: list[str],
    missing_skills: list[str],
    skills_score: float,
    experience_score: float,
    semantic_score: float,
    education_score: float,
) -> list[str]:
    reasons = []

    # Skills
    if matched_skills:
        reasons.append(f"Matched skills: {', '.join(sorted(matched_skills))}")
    if missing_skills:
        reasons.append(f"Missing required skills: {', '.join(sorted(missing_skills))}")

    if skills_score >= 0.8:
        reasons.append("Strong skills match for the role")
    elif skills_score < 0.5:
        reasons.append("Weak skills alignment with job requirements")

    # Experience
    if experience_score == 1.0:
        reasons.append("Meets or exceeds required experience")
    elif experience_score < 0.7:
        reasons.append("Below required experience level")

    # Semantic
    if semantic_score >= 0.8:
        reasons.append("High semantic similarity to job description")
    elif semantic_score < 0.5:
        reasons.append("Low relevance to job role based on description")

    # Education
    if education_score == 1.0:
        reasons.append("Meets education requirement")
    elif education_score < 0.7:
        reasons.append("Does not fully meet education requirement")

    return reasons


def generate_readable_summary(
    full_name: str | None,
    total_score: float,
    reasons: list[str],
) -> str:
    name = full_name or "The candidate"

    if total_score >= 0.8:
        performance = "a strong match for the role"
    elif total_score >= 0.6:
        performance = "a moderate match for the role"
    else:
        performance = "a weak match for the role"

    summary = (
        f"{name} is {performance} "
        f"(overall score: {round(total_score, 2)})."
    )

    if not reasons:
        summary += " No detailed reasoning available."
        return summary

    top_reasons = reasons[:5]
    reason_text = ". ".join(r.rstrip(".") for r in top_reasons) + "."
    summary += f" {reason_text}"

    return summary