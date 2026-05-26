from pydantic import BaseModel
from app.schemas.match import JobInput
from app.schemas.resume import ParsedCandidate

class ParsedCandidatePayload(BaseModel):
    candidate_id: str
    parsed_data: ParsedCandidate

class EvaluateParsedRequest(BaseModel):
    job: JobInput
    candidates: list[ParsedCandidatePayload]