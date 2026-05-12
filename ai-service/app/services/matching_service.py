from app.schemas.match import (
    MatchRequest,
    MatchResponse,
    RankedCandidate,
    ScoreBreakdown,
)

from app.services.embedding_service import EmbeddingService
from app.services.explanation_service import generate_readable_summary

from app.utils.timing import log_time
from app.utils.resume_text_builder import build_candidate_text


def build_explanations(
    candidate,
    matched_skills,
    missing_skills,
    skills_score,
    experience_score,
    semantic_score,
    education_score
) -> list[str]:

    reasons = []

    # Skills reasoning
    if matched_skills:
        reasons.append(
            f"Matched skills: {', '.join(matched_skills)}"
        )

    if missing_skills:
        reasons.append(
            f"Missing required skills: {', '.join(missing_skills)}"
        )

    # Skills score interpretation
    if skills_score > 0.8:
        reasons.append("Strong skills match for the role")
    elif skills_score < 0.5:
        reasons.append("Weak skills alignment with job requirements")

    # Experience reasoning
    if experience_score == 1.0:
        reasons.append("Meets or exceeds required experience")
    elif experience_score < 0.7:
        reasons.append("Below required experience level")

    # Semantic reasoning
    if semantic_score > 0.8:
        reasons.append("High semantic similarity to job description")
    elif semantic_score < 0.5:
        reasons.append("Low relevance to job role based on description")

    # Education reasoning
    if education_score == 1.0:
        reasons.append("Meets education requirement")
    elif education_score < 0.7:
        reasons.append("Does not fully meet education requirement")

    return reasons


async def match_candidates_service(
    request: MatchRequest,
    embedding_service: EmbeddingService,
) -> MatchResponse:

    with log_time(
        "match_candidates_service",
        extra={"candidate_count": len(request.candidates)}
    ):

        ranked_candidates = []

        job_embedding = embedding_service.generate_embedding(
            request.job.description
        )

        required_skills = {
            skill.lower().strip()
            for skill in request.job.required_skills
        }

        preferred_skills = {
            skill.lower().strip()
            for skill in request.job.preferred_skills
        }

        required_experience = request.job.required_experience_years
        required_education = request.job.required_education_level

        education_rank = {
            "olevel": 1,
            "bachelor": 2,
            "master": 3,
            "phd": 4,
            "unknown": 0
        }

        for candidate in request.candidates:

            with log_time(
                "score_candidate",
                extra={"candidate_name": candidate.full_name}
            ):

                candidate_text = build_candidate_text(candidate)
                candidate_embedding = embedding_service.generate_embedding(
                    candidate_text
                )

                candidate_skills = {
                    skill.lower().strip()
                    for skill in candidate.skills
                }

                matched_required = required_skills & candidate_skills
                missing_required = required_skills - candidate_skills

                matched_preferred = preferred_skills & candidate_skills

                if required_skills:
                    coverage = len(matched_required) / len(required_skills)
                    penalty = len(missing_required) / len(required_skills)
                else:
                    coverage = 1.0
                    penalty = 0.0

                if preferred_skills:
                    preferred_score = len(matched_preferred) / len(preferred_skills)
                else:
                    preferred_score = 1.0

                skills_score = (
                    (coverage * 0.7) +
                    (preferred_score * 0.3)
                )

                skills_score = skills_score - (penalty * 0.2)
                skills_score = max(0.0, min(skills_score, 1.0))

                if required_experience == 0:
                    experience_score = 1.0
                else:
                    experience_score = min(
                        candidate.years_experience / required_experience,
                        1.0
                    )

                semantic_score = embedding_service.calculate_similarity(
                    candidate_embedding,
                    job_embedding
                )

                semantic_score = max(0.0, min(semantic_score, 1.0))

                candidate_level = candidate.education_level or "unknown"

                if required_education and required_education in education_rank:
                    education_score = min(
                        education_rank[candidate_level] /
                        education_rank[required_education],
                        1.0
                    )
                else:
                    education_score = 1.0

                total_score = (
                    skills_score * 0.4 +
                    semantic_score * 0.2 +
                    experience_score * 0.3 +
                    education_score * 0.1
                )
                
                reasons = build_explanations(
                        candidate,
                        list(matched_required),
                        list(missing_required),
                        skills_score,
                        experience_score,
                        semantic_score,
                        education_score
                    )
                
                readable_summary = generate_readable_summary(
                                    full_name=candidate.full_name,
                                    total_score=total_score,
                                    reasons=reasons
                                )

                ranked_candidate = RankedCandidate(
                    candidate_id=candidate.candidate_id,
                    full_name=candidate.full_name,
                    total_score=round(total_score, 3),
                    matched_skills=list(matched_required),
                    missing_skills=list(missing_required),
                    score_breakdown=ScoreBreakdown(
                        skills_score=skills_score,
                        experience_score=experience_score,
                        semantic_score=semantic_score,
                        education_score=education_score,
                    ),
                    reasons=reasons,
                    readable_summary=readable_summary
                )

                ranked_candidates.append(ranked_candidate)

        ranked_candidates.sort(
            key=lambda x: x.total_score,
            reverse=True
        )

        return MatchResponse(
            job_id=request.job.job_id,
            ranked_candidates=ranked_candidates
        )
