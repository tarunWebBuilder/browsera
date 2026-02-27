from playwright.sync_api import sync_playwright
from typing import Dict, Any
from utils import validate_inputs, logger

PARAMETER_SCHEMA = {
    "type": "object",
    "properties": {
        "pageHandle": {"type": "string"},
        "keySequence": {"type": "string"},
        "selector": {"type": ["string", "null"]}
    },
    "required": ["keySequence"]
}

def execute(inputs: Dict[str, Any], config: Dict[str, Any] = {}) -> Dict[str, Any]:
    validate_inputs(PARAMETER_SCHEMA, inputs)
    hold_duration = config.get("holdDuration", 0)
    repeat = config.get("repeat", 1)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        success = False

        try:
            for _ in range(repeat):
                if inputs.get("selector"):
                    page.press(inputs["selector"], inputs["keySequence"], delay=hold_duration)
                else:
                    page.keyboard.press(inputs["keySequence"], delay=hold_duration)
            success = True
        except Exception as e:
            logger.error(f"Use key error: {str(e)}")

        browser.close()
        return {"success": success}