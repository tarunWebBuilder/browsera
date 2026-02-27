from typing import Dict, Any
from utils import validate_inputs, logger
from engine.session_store import SESSION_STORE

PARAMETER_SCHEMA = {
    "type": "object",
    "properties": {
        "xpath": {"type": "string"},
        "attribute": {"type": "string"},  # optional, default is text
    },
    "required": ["xpath"]
}

async def execute(inputs: Dict[str, Any], config: Dict[str, Any]) -> Dict[str, Any]:
    validate_inputs(PARAMETER_SCHEMA, inputs)

    session_id = config.get("sessionId")
    if not session_id or session_id not in SESSION_STORE:
        raise ValueError("Invalid or missing sessionId")

    page = SESSION_STORE[session_id]["page"]
    attribute = inputs.get("attribute", "text")
    flatten = config.get("outputFlatten", False)

    try:
        locator = page.locator(inputs["xpath"])
        elements = await locator.element_handles()  # get all matching elements

        results = []
        for el in elements:
            if attribute in ["text", "textContent"]:
                val = await el.text_content()
            else:
                val = await el.get_attribute(attribute)

            if val:
                results.append(val.strip())

        output = results if results else None

        # flatten if only single value desired
        if flatten and isinstance(output, list):
            output = output if output else None

        count = len(results)
    except Exception as e:
        logger.error(f"Extract multiple elements error: {str(e)}")
        output = [] if flatten else None
        count = 0

    return {"output": output, "count": count}
