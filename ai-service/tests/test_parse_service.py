"""
Covers ai-service/app/services/parse_service.py: the needs_review flagging
mechanism (Phase 2), low-OCR-confidence forcing review even on a
complete-looking parse (Phase 7), and multi-language resume parsing across
all five supported languages plus the unsupported-language fallback (Phase 8).
"""
import pytest

from app.services.parse_service import detect_language, parse_resume_text

COMPLETE_RESUME_EN = (
    "John Smith\n"
    "john.smith@example.com | (555) 123-4567\n\n"
    "SKILLS\nPython, JavaScript, SQL\n\n"
    "EXPERIENCE\nSoftware Engineer at Acme Corp, 2019-2023\n\n"
    "EDUCATION\nB.Sc. Computer Science, State University, 2015-2019\n"
)

RESUMES_BY_LANG = {
    "en": COMPLETE_RESUME_EN,
    "es": (
        "Juan Pérez\njuan.perez@example.com | (555) 123-4567\n\n"
        "HABILIDADES\nPython, JavaScript, SQL, Docker\n\n"
        "EXPERIENCIA\nIngeniero de software en Acme Corp\n2019 - 2023\n"
        "Construí y mantuve servicios backend.\n\n"
        "EDUCACIÓN\nLicenciatura en Ciencias de la Computación, Universidad Estatal\n2015 - 2019\n"
    ),
    "fr": (
        "Jean Dupont\njean.dupont@example.com | (555) 123-4567\n\n"
        "COMPÉTENCES\nPython, JavaScript, SQL, Docker\n\n"
        "EXPÉRIENCE\nIngénieur logiciel chez Acme Corp\n2019 - 2023\n"
        "Conçu et développé des services backend.\n\n"
        "FORMATION\nLicence en informatique, Université d'État\n2015 - 2019\n"
    ),
    "de": (
        "Hans Müller\nhans.mueller@example.com | (555) 123-4567\n\n"
        "FÄHIGKEITEN\nPython, JavaScript, SQL, Docker\n\n"
        "BERUFSERFAHRUNG\nSoftwareingenieur bei Acme Corp\n2019 - 2023\n"
        "Entwickelte und wartete Backend-Dienste.\n\n"
        "AUSBILDUNG\nBachelor in Informatik, Staatliche Universität\n2015 - 2019\n"
    ),
    "pt": (
        "João Silva\njoao.silva@example.com | (555) 123-4567\n\n"
        "HABILIDADES\nPython, JavaScript, SQL, Docker\n\n"
        "EXPERIÊNCIA\nEngenheiro de software na Acme Corp\n2019 - 2023\n"
        "Construí e mantive serviços de backend.\n\n"
        "EDUCAÇÃO\nBacharelado em Ciência da Computação, Universidade Estadual\n2015 - 2019\n"
    ),
}


@pytest.mark.asyncio
async def test_near_empty_resume_is_flagged_needs_review_not_silently_done():
    result = await parse_resume_text("hi")
    assert result.needs_review is True
    assert len(result.fallback_reasons) >= 3


@pytest.mark.asyncio
async def test_well_formed_resume_is_not_flagged():
    result = await parse_resume_text(COMPLETE_RESUME_EN)
    assert result.needs_review is False


@pytest.mark.asyncio
async def test_low_ocr_confidence_forces_review_even_on_a_complete_looking_parse():
    result = await parse_resume_text(COMPLETE_RESUME_EN, extraction_method="ocr", ocr_confidence=35.0)
    assert result.needs_review is True
    assert "low_ocr_confidence" in result.fallback_reasons


@pytest.mark.asyncio
async def test_high_ocr_confidence_does_not_force_review():
    result = await parse_resume_text(COMPLETE_RESUME_EN, extraction_method="ocr", ocr_confidence=95.0)
    assert result.needs_review is False


@pytest.mark.parametrize("lang,text", RESUMES_BY_LANG.items())
@pytest.mark.asyncio
async def test_each_supported_language_parses_a_complete_profile(lang, text):
    result = await parse_resume_text(text, detected_lang=lang)
    assert result.full_name, f"[{lang}] full_name not extracted"
    assert result.email, f"[{lang}] email not extracted"
    assert len(result.skills) >= 3, f"[{lang}] skills not extracted: {result.skills}"
    assert result.experience is not None and len(result.experience.entries) >= 1, (
        f"[{lang}] no experience entries found — this is the core Phase 8 regression to watch for"
    )
    assert result.education_level == "bachelor", f"[{lang}] education_level={result.education_level}"
    assert result.needs_review is False, f"[{lang}] unexpectedly flagged: {result.fallback_reasons}"


def test_language_detection_identifies_each_supported_language():
    for lang, text in RESUMES_BY_LANG.items():
        assert detect_language(text) == lang


@pytest.mark.asyncio
async def test_unsupported_language_falls_back_to_english_and_is_flagged():
    japanese_resume = "田中太郎\ntanaka@example.com\n\nスキル\nPython, JavaScript\n\n職歴\nソフトウェアエンジニア\n"
    detected = detect_language(japanese_resume)
    assert detected not in {"en", "es", "fr", "de", "pt"}

    result = await parse_resume_text(japanese_resume, detected_lang=detected)
    assert result.needs_review is True
    assert "unsupported_language" in result.fallback_reasons
