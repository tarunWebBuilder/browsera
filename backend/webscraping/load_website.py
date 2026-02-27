from typing import Dict, Any
from engine.session_store import SESSION_STORE
from utils import logger
import re
import time
from playwright.async_api import async_playwright, TimeoutError

async def execute(inputs: Dict[str, Any], config: Dict[str, Any]) -> Dict[str, Any]:
    session_id = config.get("sessionId")
    if not session_id:
        raise ValueError("Missing sessionId")

    url = inputs.get("url")
    if not url or not re.match(r"^https?://", url):
        raise ValueError("Invalid URL")

    timeout_ms = config.get("timeoutMs", 30000)
    headers = config.get("headers", {})

    # Launch browser if not already in session
    if session_id not in SESSION_STORE:
        playwright = await async_playwright().start()
        browser = await playwright.chromium.launch(headless=True)
        page = await browser.new_page()
        SESSION_STORE[session_id] = {"browser": browser, "page": page, "playwright": playwright}
    else:
        page = SESSION_STORE[session_id]["page"]

    start = time.time()
    try:
        if headers:
            await page.set_extra_http_headers(headers)

        response = await page.goto(url, wait_until="domcontentloaded", timeout=timeout_ms)
        success = True
        status = response.status if response else None
        final_url = page.url
    except TimeoutError:
        logger.warning("Page load timeout")
        success = False
        status = 408
        final_url = None
    except Exception as e:
        logger.error(f"Load error: {e}")
        success = False
        status = 500
        final_url = None

    load_time = int((time.time() - start) * 1000)
    return {
        "success": success,
        "status": status,
        "finalUrl": final_url,
        "sessionId": session_id,
        "loadTime": load_time
    }
