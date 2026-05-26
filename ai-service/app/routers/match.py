from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.schemas.match import MatchRequest, MatchResponse, JobInput
from app.schemas.resume import ParsedCandidate
from app.schemas.orchestration import ParsedCandidatePayload, EvaluateParsedRequest

from app.services.matching_service import match_candidates_service
from app.services.embedding_service import EmbeddingService, get_embedding_service
from app.services.normalization_service import parsed_candidate_to_match_candidate 


router = APIRouter(prefix="/match", tags=["Match"])


@router.post("/", response_model=MatchResponse)
async def match_candidates(
    request: EvaluateParsedRequest,
    embedding_service: EmbeddingService = Depends(get_embedding_service),
):
    # THE ADAPTER LAYER: Isolate the transformation logic
    clean_candidates = [
        parsed_candidate_to_match_candidate(
            candidate_id=payload.candidate_id,
            parsed=payload.parsed_data
        )
        for payload in request.candidates
    ]

    # ASSEMBLE: Build the strict request your math engine expects
    match_request = MatchRequest(
        job=request.job,
        candidates=clean_candidates
    )

    # EXECUTE: Run the N+1 optimized matching service
    return await match_candidates_service(match_request, embedding_service)