from typing import Dict, Any
from utils import validate_inputs, logger
from engine.session_store import SESSION_STORE
from playwright.async_api import Page, TimeoutError

PARAMETER_SCHEMA = {
    "type": "object",
    "properties": {
        "selector": {"type": "string"},  # user-provided selector (CSS, XPath, etc.)
        "text": {"type": "string"}       # text to type
    },
    "required": ["selector", "text"]
}

async def execute(inputs: Dict[str, Any], config: Dict[str, Any]) -> Dict[str, Any]:
    """
    Writes text into an element specified by selector in a stored session/page.
    Supports optional clearing before typing, typing delay, and pressing Enter after typing.
    """
    validate_inputs(PARAMETER_SCHEMA, inputs)

    session_id = config.get("sessionId")
    if not session_id or session_id not in SESSION_STORE:
        logger.error(f"Invalid or missing sessionId: {session_id}")
        return {"success": False, "valueWritten": None}

    page: Page = SESSION_STORE[session_id]["page"]
    selector = inputs["selector"]
    value_written = inputs["text"]
    clear_before = config.get("clearBefore", False)
    delay = config.get("delayBetweenKeys", 0)
    submit_after = config.get("submitAfter", False)
    timeout = config.get("timeoutMs", 30000)
    success = False

    try:
        if clear_before:
            await page.fill(selector, "", timeout=timeout)

        await page.type(selector, value_written, delay=delay, timeout=timeout)

        if submit_after:
            await page.press(selector, "Enter", timeout=timeout)

        success = True
    except TimeoutError:
        logger.warning(f"Write timeout: {selector}")
    except Exception as e:
        logger.error(f"Write error: {str(e)}")

    return {"success": success, "valueWritten": value_written}
