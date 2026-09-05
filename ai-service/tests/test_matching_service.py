"""
Covers ai-service/app/services/matching_service.py: the core scoring formula,
the zero-required-skills redistribution fix (Phase 1), configurable weights
(Phase 6), and the defensive clamps added alongside both.
"""
import numpy as np
import pytest

from app.schemas.match import CandidateInput, JobInput, MatchRequest, WeightsInput
from app.services.matching_service import WEIGHTS, match_candidates_service, score_candidate
from tests.conftest import FakeEmbeddingService


def make_candidate(**overrides):
    defaults = dict(candidate_id="c1", full_name="Test Candidate", skills=[], years_experience=0.0)
    defaults.update(overrides)
    return CandidateInput(**defaults)


async def run_match(job_kwargs, candidates):
    job_defaults = dict(job_id="j1", title="Role", description="A job description", weights=None)
    job_defaults.update(job_kwargs)
    job = JobInput(**job_defaults)
    req = MatchRequest(job=job, candidates=candidates)
    return await match_candidates_service(req, FakeEmbeddingService())


@pytest.mark.asyncio
async def test_job_with_required_skills_uses_the_standard_weights():
    candidate = make_candidate(skills=["python"], years_experience=0.0)
    resp = await run_match({"required_skills": ["python"]}, [candidate])
    result = resp.ranked_candidates[0]
    expected = round(1.0 * WEIGHTS["skills"] + 1.0 * WEIGHTS["experience"] + 0.5 * WEIGHTS["semantic"] + 1.0 * WEIGHTS["education"], 3)
    assert abs(result.total_score - expected) < 0.01


@pytest.mark.asyncio
async def test_zero_required_skills_redistributes_instead_of_granting_free_credit():
    """The Phase 1 fix: a job with no required/preferred skills used to give
    every candidate a free 1.0 skills_score weighted at 40%. Now that weight
    is redistributed to the other three dimensions instead."""
    weak = make_candidate(candidate_id="weak", skills=[], years_experience=0.0)
    strong = make_candidate(candidate_id="strong", skills=[], years_experience=10.0)
    resp = await run_match({"required_skills": [], "preferred_skills": [], "required_experience_years": 10.0}, [weak, strong])
    by_id = {r.candidate_id: r for r in resp.ranked_candidates}

    old_buggy_total = 0.4 * 1.0 + 0.3 * 0.0 + 0.2 * 0.5 + 0.1 * 1.0  # what the pre-fix formula would have given `weak`
    assert by_id["weak"].total_score < old_buggy_total
    assert by_id["strong"].total_score > by_id["weak"].total_score


@pytest.mark.asyncio
async def test_custom_job_level_weights_are_applied_verbatim():
    """Phase 6: an explicit weights override changes the scoring math, not
    just cosmetically — verified against hand-computed expected totals."""
    candidate = make_candidate(skills=["python"], years_experience=5.0)
    weights = WeightsInput(skills=0.9, experience=0.05, semantic=0.025, education=0.025)
    resp = await run_match({"required_skills": ["python"], "required_experience_years": 5.0, "weights": weights}, [candidate])
    result = resp.ranked_candidates[0]
    expected = round(1.0 * 0.9 + 1.0 * 0.05 + 0.5 * 0.025 + 1.0 * 0.025, 3)
    assert abs(result.total_score - expected) < 0.01


@pytest.mark.asyncio
async def test_custom_weights_still_redistribute_correctly_on_zero_skills_job():
    candidate = make_candidate(skills=[], years_experience=5.0)
    weights = WeightsInput(skills=0.5, experience=0.3, semantic=0.1, education=0.1)
    resp = await run_match(
        {"required_skills": [], "preferred_skills": [], "required_experience_years": 5.0, "weights": weights},
        [candidate],
    )
    result = resp.ranked_candidates[0]
    # remaining=0.5 -> experience=0.3+0.5*0.6=0.6, semantic=0.1+0.5*0.2=0.2, education=0.1+0.5*0.2=0.2
    expected = round(1.0 * 0.6 + 0.5 * 0.2 + 1.0 * 0.2, 3)
    assert abs(result.total_score - expected) < 0.01


@pytest.mark.asyncio
async def test_degenerate_weights_all_on_skills_dont_crash_on_zero_skills_job():
    """Defense-in-depth: an admin-set weight config with nothing to
    redistribute to (skills=1.0, everything else=0) must not divide by zero."""
    candidate = make_candidate(skills=[], years_experience=0.0)
    weights = WeightsInput(skills=1.0, experience=0.0, semantic=0.0, education=0.0)
    resp = await run_match({"required_skills": [], "preferred_skills": [], "weights": weights}, [candidate])
    assert 0.0 <= resp.ranked_candidates[0].total_score <= 1.0


def test_exp_score_is_clamped_to_zero_minimum(fake_embedding_service):
    candidate = make_candidate(years_experience=5.0)
    result = score_candidate(
        candidate,
        candidate_embedding=np.array([1.0, 0.0]),
        job_embedding=np.array([1.0, 0.0]),
        embedding_service=fake_embedding_service,
        required_skills=set(),
        preferred_skills=set(),
        required_experience=10.0,
        required_education=None,
        weights=WEIGHTS,
    )
    assert 0.0 <= result.score_breakdown.experience_score <= 1.0
