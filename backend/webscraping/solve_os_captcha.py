from __future__ import annotations

import base64
import io
import time
from typing import Any, Dict, Optional

import pytesseract
from PIL import Image, ImageFilter, ImageOps
from engine.session_store import SESSION_STORE
from playwright.async_api import async_playwright
from utils import logger


async def _ensure_session(session_id: str):
    if session_id not in SESSION_STORE:
        playwright = await async_playwright().start()
        browser = await playwright.chromium.launch(headless=True)
        page = await browser.new_page()
        SESSION_STORE[session_id] = {"browser": browser, "page": page, "playwright": playwright}
    return SESSION_STORE[session_id]["page"]


async def _get_captcha_bytes(page, selector: str) -> bytes:
    el = await page.query_selector(selector)
    if not el:
        raise ValueError("Captcha element not found for selector")
    return await el.screenshot()


def _decode_b64(value: str) -> bytes:
    if value.startswith("data:"):
        value = value.split(",", 1)[1]
    return base64.b64decode(value)


def _preprocess_image(img: Image.Image) -> Image.Image:
    gray = ImageOps.grayscale(img)
    denoised = gray.filter(ImageFilter.MedianFilter(size=3))
    thresholded = denoised.point(lambda p: 255 if p > 140 else 0)
    return thresholded


def _solve_image_captcha(img_bytes: bytes) -> Dict[str, str]:
    image = Image.open(io.BytesIO(img_bytes))
    processed = _preprocess_image(image)
    text = pytesseract.image_to_string(processed, config="--psm 7").strip()
    return {"code": text}


async def execute(inputs: Dict[str, Any], config: Dict[str, Any]) -> Dict[str, Any]:
    session_id = config.get("sessionId")
    if not session_id:
        raise ValueError("Missing sessionId")

    captcha_type = inputs.get("captchaType")
    if not captcha_type:
        raise ValueError("Missing captchaType")

    page = None
    image_path = inputs.get("imagePath")
    image_base64 = inputs.get("imageBase64")
    image_selector = inputs.get("imageSelector")

    start = time.time()
    result: Optional[Dict[str, str]] = None

    try:
        if captcha_type in ("image", "normal", "number", "text", "math"):
            if image_path:
                with open(image_path, "rb") as fh:
                    img_bytes = fh.read()
            elif image_base64:
                img_bytes = _decode_b64(image_base64)
            elif image_selector:
                page = await _ensure_session(session_id)
                img_bytes = await _get_captcha_bytes(page, image_selector)
            else:
                raise ValueError("Provide imagePath, imageBase64, or imageSelector for image captcha")
            result = _solve_image_captcha(img_bytes)

        elif captcha_type == "textcaptcha":
            text = inputs.get("text")
            if not text:
                raise ValueError("text is required for textcaptcha")
            result = {"text": str(text).strip()}

        else:
            raise ValueError(f"Unsupported captchaType for open-source solver: {captcha_type}")

    except Exception as exc:
        logger.error(f"solveOpenSourceCaptcha error: {exc}")
        raise

    elapsed_ms = int((time.time() - start) * 1000)
    return {
        "success": True,
        "captchaType": captcha_type,
        "solution": result,
        "elapsedMs": elapsed_ms,
        "sessionId": session_id,
    }
