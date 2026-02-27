from typing import Dict, Any
from utils import validate_inputs, logger
import httpx
import re
from bs4 import BeautifulSoup

PARAMETER_SCHEMA = {
    "type": "object",
    "properties": {
        "url": {"type": "string"},
        "timeoutMs": {"type": "integer"},
        "maxChars": {"type": "integer"}
    },
    "required": ["url"]
}

def _extract_visible_text(html: str) -> str:
    soup = BeautifulSoup(html, "lxml")

    # Remove noise
    for tag in soup(["script", "style", "noscript", "svg"]):
        tag.decompose()

    # Extract text
    text = soup.get_text(separator=" ")
    text = re.sub(r"\s+", " ", text).strip()
    return text

async def execute(inputs: Dict[str, Any], config: Dict[str, Any] = {}) -> Dict[str, Any]:
    validate_inputs(PARAMETER_SCHEMA, inputs)

    url = inputs["url"].strip()
    timeout_ms = inputs.get("timeoutMs", config.get("timeoutMs", 12000))
    max_chars = inputs.get("maxChars", 30000)

    timeout = httpx.Timeout(timeout_ms / 1000)

    try:
        async with httpx.AsyncClient(timeout=timeout, follow_redirects=True) as client:
            r = await client.get(url, headers={"User-Agent": "Mozilla/5.0"})
            html = r.text

            soup = BeautifulSoup(html, "lxml")
            title = soup.title.get_text(strip=True) if soup.title else ""

            text = _extract_visible_text(html)

            # Cap text length
            if max_chars and isinstance(max_chars, int):
                text = text[:max_chars]

            return {
                "success": True,
                "url": url,
                "httpStatus": r.status_code,
                "title": title,
                "text": text,
                "htmlLength": len(html),
                "contentType": r.headers.get("content-type"),
                "server": r.headers.get("server"),
            }

    except Exception as e:
        logger.error(f"fetchPageText failed: {str(e)}")
        return {
            "success": False,
            "url": url,
            "error": str(e)
        }
