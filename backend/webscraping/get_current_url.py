from typing import Dict, Any
from utils import validate_inputs, logger
from engine.session_store import SESSION_STORE
from playwright.async_api import Page

PARAMETER_SCHEMA = {
    "type": "object",
    "properties": {
        "sessionId": {"type": "string"}  # Reference to the stored session/page
    },
    "required": ["sessionId"]
}

async def execute(inputs: Dict[str, Any], config: Dict[str, Any]) -> Dict[str, Any]:
    """
    Returns the current URL of the page stored in SESSION_STORE for the given sessionId.
    """
  

    session_id = config.get("sessionId")
    if not session_id or session_id not in SESSION_STORE:
        logger.error(f"Invalid or missing sessionId: {session_id}")
        return {"currentUrl": None}

    page: Page = SESSION_STORE[session_id]["page"]
    current_url = None

    try:
        current_url = page.url
    except Exception as e:
        logger.error(f"Get current URL error: {str(e)}")

    return {"currentUrl": current_url}
