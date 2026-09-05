import re
import os
from io import BytesIO

from fastapi import UploadFile
import fitz  # PyMuPDF
from docx import Document

from app.core.exceptions import (
    EmptyFileError,
    PasswordProtectedFileError,
    ResumeParsingError,
    UnsupportedFileTypeError,
)
from app.core.logger import logger
from app.utils.timing import log_time


# OCR (scanned/image-only PDFs)
def _ocr_pdf_pages(doc) -> tuple[str, float]:
    """Rasterize each page and OCR it. Returns (text, mean_word_confidence 0-100)."""
    import cv2
    import numpy as np
    import pytesseract

    with log_time("ocr_pdf_pages"):
        page_texts = []
        confidences = []

        for page in doc:
            # 300 DPI is a reasonable floor for OCR accuracy on scanned documents
            # without producing unreasonably large images for a resume-sized PDF.
            pix = page.get_pixmap(dpi=300)
            img = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.height, pix.width, pix.n)

            if pix.n == 4:
                gray = cv2.cvtColor(img, cv2.COLOR_RGBA2GRAY)
            elif pix.n == 3:
                gray = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY)
            else:
                gray = img[:, :, 0] if img.ndim == 3 else img

            # Adaptive thresholding compensates for uneven scan lighting/shadows —
            # a plain global threshold tends to fail on real scanned documents.
            processed = cv2.adaptiveThreshold(
                gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 31, 15
            )

            data = pytesseract.image_to_data(processed, output_type=pytesseract.Output.DICT)
            words = []
            for i, word in enumerate(data["text"]):
                if not word.strip():
                    continue
                words.append(word)
                conf = float(data["conf"][i])
                if conf >= 0:  # tesseract reports -1 confidence for non-text regions
                    confidences.append(conf)
            page_texts.append(" ".join(words))

        text = "\n".join(page_texts).strip()
        mean_confidence = (sum(confidences) / len(confidences)) if confidences else 0.0
        return text, mean_confidence


# PDF TEXT EXTRACTION (PyMuPDF, with OCR fallback for scanned/image-only PDFs)
def extract_pdf_text(file_bytes: bytes) -> dict:
    with log_time("extract_pdf_text_pymupdf"):
        try:
            doc = fitz.open(stream=file_bytes, filetype="pdf")

            if doc.is_encrypted and not doc.authenticate(""):
                doc.close()
                raise PasswordProtectedFileError()

            text = ""
            for page in doc:
                text += page.get_text("text") + "\n"
            text = text.strip()

            if text:
                doc.close()
                return {"text": text, "extraction_method": "text", "ocr_confidence": None}

            # No extractable text layer — likely a scanned/photographed resume.
            logger.warning("Empty PDF text layer detected — falling back to OCR.")
            try:
                ocr_text, confidence = _ocr_pdf_pages(doc)
            finally:
                doc.close()
            return {"text": ocr_text, "extraction_method": "ocr", "ocr_confidence": confidence}

        except PasswordProtectedFileError:
            raise
        except Exception as e:
            # Third-party (PyMuPDF) exception text can be arbitrary internals —
            # log it server-side, but never echo it straight into a user-facing message.
            logger.error("PyMuPDF extraction failed: %s", e, exc_info=True)
            raise ResumeParsingError("We couldn't read this PDF — it may be corrupted.")


# DOCX EXTRACTION
def extract_docx_text(file_bytes: bytes) -> str:
    with log_time("extract_docx_text"):
        try:
            docx_stream = BytesIO(file_bytes)
            document = Document(docx_stream)

            return "\n".join(paragraph.text for paragraph in document.paragraphs)
        except Exception as e:
            logger.error("python-docx extraction failed: %s", e, exc_info=True)
            raise ResumeParsingError("We couldn't read this DOCX file — it may be corrupted.")


# TEXT CLEANING
def clean_text(text: str) -> str:
    with log_time("clean_text"):
        lines = []

        for raw_line in text.splitlines():
            normalized = re.sub(r"[ \t]+", " ", raw_line).strip()
            if normalized:
                lines.append(normalized)

        return "\n".join(lines).strip()


# MAIN ENTRY POINT
def extract_text_from_file(file: UploadFile) -> dict:
    """Returns {"text", "extraction_method": "text"|"ocr", "ocr_confidence": float|None}."""
    try:
        logger.info(f"Starting extraction for file: {file.filename}")

        file.file.seek(0)
        file_bytes = file.file.read()

        if not file_bytes:
            raise EmptyFileError()

        extension = os.path.splitext(file.filename.lower())[1]

        logger.info(f"Detected file type: {extension}")

        if extension == ".pdf":
            result = extract_pdf_text(file_bytes)
        elif extension == ".docx":
            result = {"text": extract_docx_text(file_bytes), "extraction_method": "text", "ocr_confidence": None}
        else:
            raise UnsupportedFileTypeError()

        logger.info("Text extraction completed", extra={"extraction_method": result["extraction_method"]})

        result["text"] = clean_text(result["text"])

        logger.info("Text cleaning completed")

        return result

    except (UnsupportedFileTypeError, EmptyFileError, PasswordProtectedFileError, ResumeParsingError):
        raise

    except Exception as e:
        logger.error("Extraction failed unexpectedly: %s", e, exc_info=True)
        raise ResumeParsingError("We couldn't read this file — it may be corrupted.")
