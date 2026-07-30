import io
from pathlib import Path
from typing import Optional


def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract all text from a PDF file using pdfplumber."""
    try:
        import pdfplumber
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            pages_text = []
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    pages_text.append(text)
            return "\n".join(pages_text)
    except Exception as e:
        return f"[PDF extraction error: {e}]"


def extract_text_from_docx(file_bytes: bytes) -> str:
    """Extract all text from a DOCX file using python-docx."""
    try:
        from docx import Document
        doc = Document(io.BytesIO(file_bytes))
        paragraphs = [para.text for para in doc.paragraphs if para.text.strip()]
        return "\n".join(paragraphs)
    except Exception as e:
        return f"[DOCX extraction error: {e}]"


def extract_text(file_bytes: bytes, filename: str) -> str:
    """Route extraction based on file extension."""
    ext = Path(filename).suffix.lower()
    if ext == ".pdf":
        return extract_text_from_pdf(file_bytes)
    elif ext in (".docx", ".doc"):
        return extract_text_from_docx(file_bytes)
    else:
        # Attempt plain text
        try:
            return file_bytes.decode("utf-8", errors="ignore")
        except Exception:
            return ""
