from __future__ import annotations

import base64
import os
import time
from typing import Any, Dict, Optional

from engine.session_store import SESSION_STORE
from playwright.async_api import async_playwright
from twocaptcha import TwoCaptcha
from utils import logger


async def _ensure_session(session_id: str):
    if session_id not in SESSION_STORE:
        playwright = await async_playwright().start()
        browser = await playwright.chromium.launch(headless=True)
        page = await browser.new_page()
        SESSION_STORE[session_id] = {"browser": browser, "page": page, "playwright": playwright}
    return SESSION_STORE[session_id]["page"]


def _get_solver(api_key: Optional[str]) -> TwoCaptcha:
    key = api_key or os.getenv("APIKEY_2CAPTCHA") or os.getenv("TWOCAPTCHA_API_KEY")
    if not key:
        raise ValueError("Missing 2Captcha API key (APIKEY_2CAPTCHA)")
    return TwoCaptcha(key)


async def _get_captcha_bytes(page, selector: str) -> bytes:
    el = await page.query_selector(selector)
    if not el:
        raise ValueError("Captcha element not found for selector")
    return await el.screenshot()


def _decode_b64(value: str) -> bytes:
    if value.startswith("data:"):
        value = value.split(",", 1)[1]
    return base64.b64decode(value)


async def execute(inputs: Dict[str, Any], config: Dict[str, Any]) -> Dict[str, Any]:
    session_id = config.get("sessionId")
    if not session_id:
        raise ValueError("Missing sessionId")

    captcha_type = inputs.get("captchaType")
    if not captcha_type:
        raise ValueError("Missing captchaType")

    solver = _get_solver(inputs.get("captchaApiKey"))
    page = await _ensure_session(session_id)

    start = time.time()
    result = None

    # Common inputs
    image_path = inputs.get("imagePath")
    image_base64 = inputs.get("imageBase64")
    image_selector = inputs.get("imageSelector")
    page_url = inputs.get("pageUrl")
    site_key = inputs.get("siteKey")

    try:
        if captcha_type in ("image", "normal", "number", "text", "math"):
            if image_path:
                result = solver.normal(image_path)
            elif image_base64:
                result = solver.normal(_decode_b64(image_base64))
            elif image_selector:
                img_bytes = await _get_captcha_bytes(page, image_selector)
                result = solver.normal(img_bytes)
            else:
                raise ValueError("Provide imagePath, imageBase64, or imageSelector for image captcha")

        elif captcha_type in ("recaptcha_v2", "recaptcha_v2_invisible", "recaptcha_v2_callback"):
            if not page_url or not site_key:
                raise ValueError("pageUrl and siteKey are required for reCAPTCHA v2")
            result = solver.recaptcha(sitekey=site_key, url=page_url, invisible=captcha_type != "recaptcha_v2")

        elif captcha_type == "recaptcha_v3":
            if not page_url or not site_key:
                raise ValueError("pageUrl and siteKey are required for reCAPTCHA v3")
            result = solver.recaptcha(sitekey=site_key, url=page_url, version="v3", score=inputs.get("score", 0.3))

        elif captcha_type == "turnstile":
            if not page_url or not site_key:
                raise ValueError("pageUrl and siteKey are required for Turnstile")
            result = solver.turnstile(sitekey=site_key, url=page_url)

        elif captcha_type == "geetest":
            result = solver.geetest(
                url=page_url,
                gt=inputs.get("gt"),
                challenge=inputs.get("challenge"),
                api_server=inputs.get("apiServer"),
            )

        elif captcha_type == "funcaptcha":
            result = solver.funcaptcha(sitekey=site_key, url=page_url, surl=inputs.get("surl"))

        elif captcha_type == "hcaptcha":
            result = solver.hcaptcha(sitekey=site_key, url=page_url)

        elif captcha_type == "keycaptcha":
            result = solver.keycaptcha(
                url=page_url,
                s_s_c_user_id=inputs.get("s_s_c_user_id"),
                s_s_c_session_id=inputs.get("s_s_c_session_id"),
                s_s_c_web_server_sign=inputs.get("s_s_c_web_server_sign"),
                s_s_c_web_server_sign2=inputs.get("s_s_c_web_server_sign2"),
            )

        elif captcha_type == "capy":
            result = solver.capy(sitekey=site_key, url=page_url, api_server=inputs.get("apiServer"))

        elif captcha_type == "datadome":
            result = solver.datadome(
                url=page_url,
                captcha_url=inputs.get("captchaUrl"),
                user_agent=inputs.get("userAgent"),
            )

        elif captcha_type == "textcaptcha":
            result = solver.textcaptcha(text=inputs.get("text"))

        else:
            raise ValueError(f"Unsupported captchaType: {captcha_type}")

    except Exception as exc:
        logger.error(f"solveCaptcha error: {exc}")
        raise

    elapsed_ms = int((time.time() - start) * 1000)
    return {
        "success": True,
        "captchaType": captcha_type,
        "solution": result,
        "elapsedMs": elapsed_ms,
        "sessionId": session_id,
    }
