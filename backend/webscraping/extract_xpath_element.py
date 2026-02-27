from typing import Dict, Any
from utils import validate_inputs, logger
from engine.session_store import SESSION_STORE

PARAMETER_SCHEMA = {
    "type": "object",
    "properties": {
        "xpath": {"type": "string"},
        "attribute": {"type": "string"},
    },
    "required": ["xpath"]
}

async def execute(inputs: Dict[str, Any], config: Dict[str, Any]) -> Dict[str, Any]:
    validate_inputs(PARAMETER_SCHEMA, inputs)

    session_id = config.get("sessionId")
    if not session_id or session_id not in SESSION_STORE:
        raise ValueError("Invalid or missing sessionId")

    page = SESSION_STORE[session_id]["page"]

    multiple = config.get("multiple", False)
    trim = config.get("trim", True)

    results = []
    count = 0

    try:
        locator = page.locator(inputs["xpath"])

        if multiple:
            elements = await locator.all()  # list of ElementHandle
        else:
            elements = [await locator.first.element_handle()]

        for el in elements:
            if el:
                if not inputs.get("attribute") or inputs["attribute"] in ["text", "textContent"]:
                    val = await el.text_content()
                else:
                    val = await el.get_attribute(inputs["attribute"])
                if trim and isinstance(val, str):
                    val = val.strip()
                results.append(val)

        count = len(results)
        output = results if multiple else results[0] if results else None

    except Exception as e:
        logger.error(f"Extract XPath error: {str(e)}")
        output = [] if multiple else ""

    return {"output": output, "count": count}
