import json
from typing import Dict, Any
from utils import validate_inputs, logger

PARAMETER_SCHEMA = {
    "type": "object",
    "properties": {
        "fileRef": {"type": "string"},
        "jsonPayload": {"type": ["object", "null"]}
    }
}

def execute(inputs: Dict[str, Any], config: Dict[str, Any] = {}) -> Dict[str, Any]:
    validate_inputs(PARAMETER_SCHEMA, inputs)
    schema = config.get("schema", None)  # For validation

    try:
        with open(inputs.get("fileRef", ""), "r") as f:
            data = json.load(f)
        if schema:
            jsonschema.validate(data, schema)
        obj_ref = id(data)
    except Exception as e:
        logger.error(f"Load JSON error: {str(e)}")
        obj_ref = None

    return {"parsedJson": obj_ref}