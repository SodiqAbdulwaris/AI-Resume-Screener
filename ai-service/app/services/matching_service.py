from app.config.parser_config import DEGREE_HIERARCHY
from app.schemas.match import (
    MatchRequest,
    MatchResponse,
    RankedCandidate,
    ScoreBreakdown,
)
from app.services.embedding_service import EmbeddingService
from app.services.explanation_service import build_explanations, generate_readable_summary
from app.utils.resume_text_builder import build_candidate_text
from app.utils.timing import log_time

_EDUCATION_RANK: dict[str, int] = {
    **{k: v + 1 for k, v in DEGREE_HIERARCHY.items()},  # shift 0–3 → 1–4
    "unknown": 0,
}


async def match_candidates_service(
    request: MatchRequest,
    embedding_service: EmbeddingService,
) -> MatchResponse:

    with log_time(
        "match_candidates_service",
        extra={"candidate_count": len(request.candidates)},
    ):
        job_text = request.job.description
        if not job_text or not job_text.strip():
            job_text = " ".join(request.job.required_skills)

        job_embedding = embedding_service.generate_embedding(job_text)

        required_skills = {
            skill.lower().strip() for skill in request.job.required_skills
        }
        preferred_skills = {
            skill.lower().strip() for skill in request.job.preferred_skills
        }
        required_experience = request.job.required_experience_years
        required_education = request.job.required_education_level

        ranked_candidates = []

        for candidate in request.candidates:
            with log_time(
                "score_candidate",
                extra={"candidate_name": candidate.full_name},
            ):
                ranked = score_candidate(
                    candidate=candidate,
                    embedding_service=embedding_service,
                    job_embedding=job_embedding,
                    required_skills=required_skills,
                    preferred_skills=preferred_skills,
                    required_experience=required_experience,
                    required_education=required_education,
                )
                ranked_candidates.append(ranked)

        ranked_candidates.sort(key=lambda x: x.total_score, reverse=True)

        return MatchResponse(
            job_id=request.job.job_id,
            ranked_candidates=ranked_candidates,
        )


def score_candidate(
    candidate,
    embedding_service: EmbeddingService,
    job_embedding: list[float],
    required_skills: set[str],
    preferred_skills: set[str],
    required_experience: float,
    required_education: str | None,
) -> RankedCandidate:

    # Semantic score
    candidate_text = build_candidate_text(candidate)
    if not candidate_text or not candidate_text.strip():
        candidate_text = " ".join(candidate.skills) if candidate.skills else "n/a"

    candidate_embedding = embedding_service.generate_embedding(candidate_text)
    semantic_score = embedding_service.calculate_similarity(
        candidate_embedding, job_embedding
    )

    # Skills score
    candidate_skills = {skill.lower().strip() for skill in candidate.skills}

    matched_required = required_skills & candidate_skills
    missing_required = required_skills - candidate_skills
    matched_preferred = preferred_skills & candidate_skills

    if required_skills:
        coverage = len(matched_required) / len(required_skills)
        penalty = len(missing_required) / len(required_skills)
    else:
        coverage = 1.0
        penalty = 0.0

    preferred_score = (
        len(matched_preferred) / len(preferred_skills)
        if preferred_skills
        else 1.0
    )

    skills_score = (coverage * 0.7) + (preferred_score * 0.3) - (penalty * 0.2)
    skills_score = max(0.0, min(skills_score, 1.0))

    # Experience score
    if required_experience == 0:
        experience_score = 1.0
    else:
        experience_score = min(
            candidate.years_experience / required_experience, 1.0
        )

    # Education score
    candidate_level = candidate.education_level or "unknown"
    required_rank = _EDUCATION_RANK.get(required_education or "", 0)

    if required_rank == 0:
        education_score = 1.0
    else:
        candidate_rank = _EDUCATION_RANK.get(candidate_level, 0)
        education_score = min(candidate_rank / required_rank, 1.0)

    # Total score
    total_score = (
        skills_score * 0.4
        + experience_score * 0.3
        + semantic_score * 0.2
        + education_score * 0.1
    )

    # Explanations
    reasons = build_explanations(
        candidate=candidate,
        matched_skills=list(matched_required),
        missing_skills=list(missing_required),
        skills_score=skills_score,
        experience_score=experience_score,
        semantic_score=semantic_score,
        education_score=education_score,
    )

    readable_summary = generate_readable_summary(
        full_name=candidate.full_name,
        total_score=total_score,
        reasons=reasons,
    )

    return RankedCandidate(
        candidate_id=candidate.candidate_id,
        full_name=candidate.full_name,
        total_score=round(total_score, 3),
        matched_skills=sorted(matched_required),
        missing_skills=sorted(missing_required),
        score_breakdown=ScoreBreakdown(
            skills_score=round(skills_score, 3),
            experience_score=round(experience_score, 3),
            semantic_score=round(semantic_score, 3),
            education_score=round(education_score, 3),
        ),
        reasons=reasons,
        readable_summary=readable_summary,
    )