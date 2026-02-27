from __future__ import annotations

from typing import Dict, Any, Optional, Tuple
from utils import validate_inputs, logger

import os
import re
import tempfile
import requests
import pdfplumber

# ---------- Schema ----------
PARAMETER_SCHEMA = {
    "type": "object",
    "properties": {
        "source": {"type": "string"},        # URL or local path
        "maxChars": {"type": "integer"},
        "returnMarkdown": {"type": "boolean"},
        # Optional knobs:
        "useOCR": {"type": "boolean"},       # fallback OCR if extracted text is empty
        "ocrMaxPages": {"type": "integer"},  # limit pages for OCR (cost control)
        "timeoutSec": {"type": "integer"},   # HTTP timeout for URL download
    },
    "required": ["source"]
}

# ---------- Helpers ----------
def _is_url(s: str) -> bool:
    return s.lower().startswith("http://") or s.lower().startswith("https://")

def _download_to_temp(url: str, timeout_sec: int = 30) -> Tuple[str, str]:
    """
    Downloads URL to a temp file and returns (file_path, filename_guess)
    """
    r = requests.get(url, stream=True, timeout=timeout_sec, headers={
        "User-Agent": "Mozilla/5.0",
        "Accept": "application/pdf",
        "Referer": url
    })
    r.raise_for_status()

    # Try to infer filename from headers or URL path
    filename = "document.pdf"
    cd = r.headers.get("content-disposition", "") or ""
    m = re.search(r'filename="?([^"]+)"?', cd, flags=re.I)
    if m:
        filename = m.group(1).strip()

    if filename == "document.pdf":
        try:
            filename = url.split("/")[-1].split("?")[0] or filename
        except Exception:
            pass

    suffix=".pdf"
    fd, path = tempfile.mkstemp(prefix="pdf_", suffix=suffix or ".pdf")
    os.close(fd)

    with open(path, "wb") as f:
        for chunk in r.iter_content(chunk_size=1024 * 256):
            if chunk:
                f.write(chunk)

    return path, filename

def _extract_text_pdfplumber(pdf_path: str, max_chars: int = 30000) -> str:
    text_parts = []
    total = 0

    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text() or ""
            if page_text.strip():
                text_parts.append(page_text)
                total += len(page_text) + 1
                if total >= max_chars:
                    break

    text = "\n\n".join(text_parts).strip()
    return text[:max_chars] if max_chars else text

def _looks_like_scanned(extracted_text: str) -> bool:
    # Heuristic: if no text or extremely tiny, likely scanned
    if not extracted_text:
        return True
    if len(extracted_text.strip()) < 200:
        return True
    return False

def _ocr_pdf(pdf_path: str, max_pages: int = 5, max_chars: int = 30000) -> str:
    """
    OCR fallback (optional). Requires pytesseract + pdf2image + poppler + tesseract.
    """
    try:
        from pdf2image import convert_from_path
        import pytesseract
    except Exception as e:
        raise RuntimeError(
            "OCR requested but pytesseract/pdf2image not installed. "
            "Install: pip install pytesseract pdf2image pillow "
            "and apt install tesseract-ocr poppler-utils"
        ) from e

    # Convert first N pages to images
    images = convert_from_path(pdf_path, first_page=1, last_page=max_pages)
    chunks = []
    total = 0

    for img in images:
        t = pytesseract.image_to_string(img) or ""
        if t.strip():
            chunks.append(t)
            total += len(t) + 1
            if total >= max_chars:
                break

    text = "\n\n".join(chunks).strip()
    return text[:max_chars] if max_chars else text

def _to_basic_markdown(text: str, title: Optional[str] = None) -> str:
    """
    Minimal markdown: optional title + plain text.
    You can enhance later with heading detection.
    """
    if not text:
        return ""
    if title:
        return f"# {title}\n\n{text}"
    return text
def execute(inputs: Dict[str, Any], config: Dict[str, Any] = {}) -> Dict[str, Any]:
    # validate_inputs(PARAMETER_SCHEMA, inputs)

    source = str(inputs["source"]).strip()
    max_chars = int(inputs.get("maxChars", 30000) or 30000)
    return_markdown = bool(inputs.get("returnMarkdown", True))

    use_ocr = bool(inputs.get("useOCR", False))
    ocr_max_pages = int(inputs.get("ocrMaxPages", 5) or 5)
    timeout_sec = int(inputs.get("timeoutSec", 30) or 30)

    temp_path = None
    pdf_path = None
    filename_guess = None

    try:
        # 1️⃣ Resolve PDF path
        if _is_url(source):
            temp_path, filename_guess = _download_to_temp(
                source, timeout_sec=timeout_sec
            )
            pdf_path = temp_path
        else:
            pdf_path = source
            filename_guess = os.path.basename(source)

        # 2️⃣ Fast text extraction
        extracted = _extract_text_pdfplumber(pdf_path, max_chars=max_chars)

        # 3️⃣ Optional OCR fallback
        used_ocr = False
        if use_ocr and _looks_like_scanned(extracted):
            extracted = _ocr_pdf(
                pdf_path,
                max_pages=ocr_max_pages,
                max_chars=max_chars,
            )
            used_ocr = True

        # 4️⃣ Markdown output
        md = (
            _to_basic_markdown(extracted, title=filename_guess)
            if return_markdown
            else extracted
        )

        return {
            "success": True,
            "source": source,
            "output": {
                "format": "markdown" if return_markdown else "text",
                "markdown": md,
                "length": len(md),
            },
            "metadata": {
                "filename": filename_guess,
                "usedOCR": used_ocr,
                "ocrMaxPages": ocr_max_pages if used_ocr else 0,
                "maxChars": max_chars,
            },
        }

    except Exception as e:
        logger.error(f"pdf_to_markdown failed: {str(e)}")
        return {
            "success": False,
            "source": source,
            "error": str(e),
        }

    finally:
        # 5️⃣ Cleanup temp file
        if temp_path and os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception:
                pass
