from typing import Dict, Any
from playwright.async_api import async_playwright
from engine.session_store import SESSION_STORE
import uuid

async def execute(inputs: Dict[str, Any], config: Dict[str, Any] = {}) -> Dict[str, Any]:
    browser_type = inputs.get("browserType", "chromium")
    headless = inputs.get("headless", True)

    playwright = await async_playwright().start()
    browser_launcher = playwright.chromium if browser_type == "chromium" else playwright.firefox

    browser = await browser_launcher.launch(headless=headless)
    context = await browser.new_context()
    page = await context.new_page()

    session_id = str(uuid.uuid4())

    SESSION_STORE[session_id] = {
        "playwright": playwright,
        "browser": browser,
        "context": context,
        "page": page,
    }

    return {
        "sessionId": session_id,
        "success": True
    }
