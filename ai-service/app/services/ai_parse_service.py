from typing import Any

import httpx

from app.config.settings import get_settings
from app.core.logger import logger
from app.schemas.resume import ParsedCandidate


settings = get_settings()


async def maybe_parse_resume_with_ai(
    raw_text: str,
    sections: dict[str, dict[str, Any]],
    heuristic_candidate: ParsedCandidate,
    fallback_reasons: list[str],
) -> ParsedCandidate | None:
    if not settings.PARSER_AI_ENABLED or not settings.PARSER_AI_URL:
        return None

    payload = {
        "raw_text": raw_text,
        "sections": sections,
        "heuristic_candidate": heuristic_candidate.model_dump(),
        "fallback_reasons": fallback_reasons,
        "target_schema": ParsedCandidate.model_json_schema(),
    }

    headers = {"Content-Type": "application/json"}
    if settings.PARSER_AI_API_KEY:
        headers["Authorization"] = f"Bearer {settings.PARSER_AI_API_KEY}"

    try:
        async with httpx.AsyncClient(timeout=settings.PARSER_AI_TIMEOUT_SECONDS) as client:
            response = await client.post(
                settings.PARSER_AI_URL,
                json=payload,
                headers=headers,
            )
            response.raise_for_status()
    except Exception:
        logger.warning("AI parser fallback request failed", exc_info=True)
        return None

    data = response.json()
    candidate_payload = data.get("candidate", data)

    try:
        return ParsedCandidate.model_validate(candidate_payload)
    except Exception:
        logger.warning("AI parser fallback returned invalid schema", exc_info=True)
        return None
