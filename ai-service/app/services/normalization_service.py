from app.schemas.resume import ParsedCandidate
from app.schemas.match import CandidateInput


def parsed_candidate_to_match_candidate(
    candidate_id: str,
    parsed: ParsedCandidate
) -> CandidateInput:
    
    years_experience = parsed.years_experience
    if years_experience is None and parsed.experience is not None:
        years_experience = parsed.experience.total_years

    # added Fallbacks
    return CandidateInput(
        candidate_id=candidate_id,
        full_name=parsed.full_name or "Unknown Candidate",
        email=parsed.email or "",                          
        skills=parsed.skills or [],
        years_experience=years_experience or 0.0,
        education_level=parsed.education_level,
        raw_text=parsed.raw_text or "",                    
    )