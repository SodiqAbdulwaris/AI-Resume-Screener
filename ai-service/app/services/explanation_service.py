from typing import List


def generate_readable_summary(
    full_name: str | None,
    total_score: float,
    reasons: List[str]
) -> str:

    # Base intro
    name = full_name or "The candidate"

    # Score interpretation
    if total_score >= 0.8:
        performance = "a strong match for the role"
    elif total_score >= 0.6:
        performance = "a moderate match for the role"
    else:
        performance = "a weak match for the role"

    summary = f"{name} is {performance} (score: {round(total_score, 2)}). "

    # Convert reasons into narrative
    if reasons:
        summary += "Key insights: "

        for i, reason in enumerate(reasons[:5]):  # limit noise
            summary += reason.lower()

            if i < len(reasons[:5]) - 1:
                summary += ", "
            else:
                summary += "."
    else:
        summary += "No detailed reasoning available."

    return summary
