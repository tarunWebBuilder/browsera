from typing import Dict, Any
from utils import validate_inputs, logger
from engine.session_store import SESSION_STORE
from playwright.async_api import TimeoutError

PARAMETER_SCHEMA = {
    "type": "object",
    "properties": {
        "xpath": {"type": "string"},
        "clickType": {"type": "string", "enum": ["left", "right", "dbl"]}  # optional
    },
    "required": ["xpath"]
}

async def execute(inputs: Dict[str, Any], config: Dict[str, Any]) -> Dict[str, Any]:
    validate_inputs(PARAMETER_SCHEMA, inputs)

    session_id = config.get("sessionId")
    if not session_id or session_id not in SESSION_STORE:
        raise ValueError("Invalid or missing sessionId")

    page = SESSION_STORE[session_id]["page"]
    selector = f'xpath={inputs["xpath"]}'
    click_type = inputs.get("clickType", "left")
    timeout = config.get("timeoutMs", 30000)
    success = False

    try:
        if click_type == "dbl":
            await page.dblclick(selector, timeout=timeout)
        else:
            await page.click(selector, button=click_type, timeout=timeout)
        success = True
    except TimeoutError:
        logger.warning(f"Click XPath attempt timed out: {selector}")
    except Exception as e:
        logger.error(f"Click XPath error: {str(e)}")

    return {"success": success}
