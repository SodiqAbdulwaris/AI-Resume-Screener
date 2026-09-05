"""
Covers ai-service/app/utils/extractor.py: empty-file detection (Phase 2),
sanitized error messages (Phase 2), password-protected PDF detection
(Phase 2), and the OCR fallback for scanned/image-only PDFs (Phase 7).

No real Tesseract binary is required to run this suite — pytesseract's
`image_to_data` is monkeypatched, matching the project's stated CI strategy
for OCR (see the Phase 7 hardening plan). Everything around it (PyMuPDF
rasterization, OpenCV preprocessing, confidence aggregation) runs for real.
"""
import io

import fitz
import pytest

from app.core.exceptions import EmptyFileError, PasswordProtectedFileError, ResumeParsingError
from app.utils.extractor import extract_pdf_text, extract_text_from_file


class FakeUploadFile:
    def __init__(self, content: bytes, filename: str):
        self.file = io.BytesIO(content)
        self.filename = filename


def make_pdf_bytes(text="Plain resume content"):
    doc = fitz.open()
    page = doc.new_page()
    page.insert_text((72, 72), text)
    buf = io.BytesIO()
    doc.save(buf)
    doc.close()
    return buf.getvalue()


def make_encrypted_pdf_bytes(text="Secret resume content"):
    doc = fitz.open()
    page = doc.new_page()
    page.insert_text((72, 72), text)
    buf = io.BytesIO()
    doc.save(buf, encryption=fitz.PDF_ENCRYPT_AES_256, owner_pw="owner123", user_pw="user123")
    doc.close()
    return buf.getvalue()


def make_scanned_pdf_bytes(text="Scanned resume content"):
    """A PDF with NO text layer — a flat image, like a real scanned document."""
    src = fitz.open()
    src_page = src.new_page()
    src_page.insert_text((72, 72), text)
    pix = src_page.get_pixmap(dpi=150)
    img_bytes = pix.tobytes("png")
    src.close()

    doc = fitz.open()
    page = doc.new_page()
    page.insert_image(page.rect, stream=img_bytes)
    buf = io.BytesIO()
    doc.save(buf)
    doc.close()
    return buf.getvalue()


def test_zero_byte_file_raises_empty_file_error():
    with pytest.raises(EmptyFileError):
        extract_text_from_file(FakeUploadFile(b"", "resume.pdf"))


def test_corrupted_pdf_raises_sanitized_error_without_leaking_library_internals():
    with pytest.raises(ResumeParsingError) as exc_info:
        extract_text_from_file(FakeUploadFile(b"%PDF-1.4 not a real pdf body", "resume.pdf"))
    message = exc_info.value.message.lower()
    assert "pymupdf" not in message
    assert "traceback" not in message


def test_corrupted_docx_raises_sanitized_error_without_leaking_library_internals():
    with pytest.raises(ResumeParsingError) as exc_info:
        extract_text_from_file(FakeUploadFile(b"not a real docx zip file", "resume.docx"))
    message = exc_info.value.message.lower()
    assert "badzipfile" not in message
    assert "package" not in message


def test_password_protected_pdf_is_detected():
    with pytest.raises(PasswordProtectedFileError):
        extract_text_from_file(FakeUploadFile(make_encrypted_pdf_bytes(), "resume.pdf"))


def test_normal_pdf_extracts_directly_without_ocr():
    result = extract_pdf_text(make_pdf_bytes("Plain resume content"))
    assert result["extraction_method"] == "text"
    assert result["ocr_confidence"] is None
    assert "Plain resume content" in result["text"]


def test_scanned_pdf_falls_back_to_ocr(monkeypatch):
    import pytesseract

    def mock_image_to_data(image, output_type=None, **kwargs):
        return {"text": ["John", "Smith"], "conf": [92.0, 88.0]}

    monkeypatch.setattr(pytesseract, "image_to_data", mock_image_to_data)

    result = extract_pdf_text(make_scanned_pdf_bytes())
    assert result["extraction_method"] == "ocr"
    assert "John" in result["text"] and "Smith" in result["text"]
    assert abs(result["ocr_confidence"] - 90.0) < 0.01
