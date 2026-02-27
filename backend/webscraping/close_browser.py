from typing import Dict, Any
from utils import validate_inputs, logger
from engine.session_store import SESSION_STORE
from playwright.async_api import Browser, Page

PARAMETER_SCHEMA = {
    "type": "object",
    "properties": {
        "sessionId": {"type": "string"},  # Reference to stored session/page
        "forceClose": {"type": "boolean"}  # Optional, defaults to False
    },
    "required": ["sessionId"]
}

async def execute(inputs: Dict[str, Any], config: Dict[str, Any] = {}) -> Dict[str, Any]:
    """
    Closes the browser/page associated with the given sessionId in SESSION_STORE.
    """
    validate_inputs(PARAMETER_SCHEMA, inputs)

    session_id = inputs.get("sessionId")
    force_close = inputs.get("forceClose", False)

    if not session_id or session_id not in SESSION_STORE:
        logger.error(f"Invalid or missing sessionId: {session_id}")
        return {"success": False}

    session = SESSION_STORE.get(session_id)
    success = False

    try:
        browser: Browser = session.get("browser")
        page: Page = session.get("page")

        if page:
            await page.close()
        if browser:
            await browser.close()

        # Clean up session store
        SESSION_STORE.pop(session_id, None)
        success = True
        logger.info(f"Browser session {session_id} closed successfully")

    except Exception as e:
        logger.error(f"Error closing browser session {session_id}: {str(e)}")
        if force_close:
            # Still remove session even if error
            SESSION_STORE.pop(session_id, None)
            success = True

    return {"success": success}
