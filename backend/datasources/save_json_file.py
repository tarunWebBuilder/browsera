import json
from typing import Dict, Any
from utils import validate_inputs, logger

PARAMETER_SCHEMA = {
    "type": "object",
    "properties": {
        "fileRef": {"type": "string"},
        "jsonPayload": {"type": "object"}
    },
    "required": ["jsonPayload"]
}

def execute(inputs: Dict[str, Any], config: Dict[str, Any] = {}) -> Dict[str, Any]:
    validate_inputs(PARAMETER_SCHEMA, inputs)
    pretty_print = config.get("prettyPrint", False)

    try:
        with open(inputs.get("fileRef", "output.json"), "w") as f:
            json.dump(inputs["jsonPayload"], f, indent=4 if pretty_print else None)
        file_ref = inputs.get("fileRef")
    except Exception as e:
        logger.error(f"Save JSON error: {str(e)}")
        file_ref = None

    return {"fileRef": file_ref}