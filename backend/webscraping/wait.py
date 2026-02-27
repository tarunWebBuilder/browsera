import time
from typing import Dict, Any
from utils import validate_inputs, logger

PARAMETER_SCHEMA = {
    "type": "object",
    "properties": {
        "previousOutput": {"type": ["object", "null"]}
    }
}

def execute(inputs: Dict[str, Any], config: Dict[str, Any] = {}) -> Dict[str, Any]:
    validate_inputs(PARAMETER_SCHEMA, inputs)
    duration = config.get("duration", 1000)
    condition_selector = config.get("conditionSelector")

    start = time.time()
    if condition_selector:
        # Placeholder: In full impl, use page.wait_for_selector if pageHandle provided
        logger.info(f"Waiting for selector: {condition_selector}")
    else:
        time.sleep(duration / 1000)
    waited_ms = (time.time() - start) * 1000
    return {"success": True, "waitedMs": waited_ms}