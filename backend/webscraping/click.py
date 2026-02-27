from typing import Dict, Any
from utils import validate_inputs, logger
from engine.session_store import SESSION_STORE
from playwright.async_api import TimeoutError, Page

PARAMETER_SCHEMA = {
    "type": "object",
    "properties": {
        "selector": {"type": "string"},
        "selectorType": {"type": "string", "enum": ["css", "xpath", "id", "name"]},
        "clickType": {"type": "string", "enum": ["left", "right", "dbl"]},
        "currentUrl": {"type": "string"},      # optional, to detect navigation
        "scrollIntoView": {"type": "boolean"}, # optional, default False
        "timeoutMs": {"type": "integer"},      # optional, max wait
        "waitForSelectorBefore": {"type": "integer"} # optional, wait before click
    },
    "required": ["selector", "selectorType"]
}

async def execute(inputs: Dict[str, Any], config: Dict[str, Any]) -> Dict[str, Any]:
    validate_inputs(PARAMETER_SCHEMA, inputs)

    session_id = config.get("sessionId")
    if not session_id or session_id not in SESSION_STORE:
        raise ValueError("Invalid or missing sessionId")

    page: Page = SESSION_STORE[session_id]["page"]

    # Input params
    selector = inputs["selector"]
    selector_type = inputs["selectorType"]
    click_type = inputs.get("clickType", "left")
    current_url = inputs.get("currentUrl")
    scroll_into_view = inputs.get("scrollIntoView", False)
    timeout = inputs.get("timeoutMs", 30000)
    wait_before = inputs.get("waitForSelectorBefore", 0)

    success = False
    navigation_occurred = False
    new_page_handle = None

    try:
        # Build locator based on type
        if selector_type == "xpath":
            locator = page.locator(f"xpath={selector}")
        elif selector_type == "id":
            locator = page.locator(f"#{selector}")
        elif selector_type == "name":
            locator = page.locator(f"[name='{selector}']")
        else:  # css
            locator = page.locator(selector)

        # Wait before click if configured
        if wait_before > 0:
            await page.wait_for_timeout(wait_before)

        # Wait for element to exist in DOM
        await locator.wait_for(timeout=timeout)

        # Scroll into view if requested
        if scroll_into_view:
            await locator.scroll_into_view_if_needed()

        # Perform click
        if click_type == "dbl":
            await locator.dblclick(timeout=timeout)
        else:
            await locator.click(button=click_type, timeout=timeout)

        success = True

        # Detect navigation
        if current_url and page.url != current_url:
            navigation_occurred = True

    except TimeoutError:
        logger.warning(f"Click failed: element not found or not clickable: {selector}")
    except Exception as e:
        logger.error(f"Click error: {str(e)}")

    return {
        "success": success,
        "navigationOccurred": navigation_occurred,
        "newPageHandle": new_page_handle
    }
