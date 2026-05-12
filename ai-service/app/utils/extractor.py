import re
import os
from io import BytesIO

from fastapi import UploadFile
import fitz  # PyMuPDF
from docx import Document

from app.core.exceptions import UnsupportedFileTypeError, ResumeParsingError
from app.core.logger import logger
from app.utils.timing import log_time


# PDF TEXT EXTRACTION (PyMuPDF)
def extract_pdf_text(file_bytes: bytes) -> str:
    with log_time("extract_pdf_text_pymupdf"):
        try:
            doc = fitz.open(stream=file_bytes, filetype="pdf")

            text = ""
            for page in doc:
                text += page.get_text("text") + "\n"

            doc.close()

            text = text.strip()

            # OCR for later
            if not text:
                logger.warning("Empty PDF text detected. OCR fallback needed.")
                # use pytesseract and image conversion for OCR later

            return text

        except Exception as e:
            logger.error("PyMuPDF extraction failed", exc_info=True)
            raise ResumeParsingError(f"PDF extraction failed: {str(e)}")


# DOCX EXTRACTION
def extract_docx_text(file_bytes: bytes) -> str:
    with log_time("extract_docx_text"):
        docx_stream = BytesIO(file_bytes)
        document = Document(docx_stream)

        return "\n".join(paragraph.text for paragraph in document.paragraphs)


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
def extract_text_from_file(file: UploadFile) -> str:
    try:
        logger.info(f"Starting extraction for file: {file.filename}")

        file.file.seek(0)
        file_bytes = file.file.read()

        if not file_bytes:
            raise UnsupportedFileTypeError()

        extension = os.path.splitext(file.filename.lower())[1]

        logger.info(f"Detected file type: {extension}")

        if extension == ".pdf":
            text = extract_pdf_text(file_bytes)

        elif extension == ".docx":
            text = extract_docx_text(file_bytes)

        else:
            raise UnsupportedFileTypeError()

        logger.info("Text extraction completed")

        cleaned_text = clean_text(text)

        logger.info("Text cleaning completed")

        return cleaned_text

    except UnsupportedFileTypeError:
        logger.error(f"Unsupported file type: {file.filename}", exc_info=True)
        raise

    except Exception as e:
        logger.error("Extraction failed unexpectedly", exc_info=True)
        raise ResumeParsingError(f"Extraction failed: {str(e)}")
