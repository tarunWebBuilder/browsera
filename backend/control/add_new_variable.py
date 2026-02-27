from typing import Dict, Any
from utils import validate_inputs

PARAMETER_SCHEMA = {
    "type": "object",
    "required": ["name", "value"],
    "properties": {
        "name": {"type": "string"},
        "value": {
            "type": ["string", "number", "boolean", "object", "array"]
        }
    }
}

def execute(inputs: Dict[str, Any], config: Dict[str, Any] = {}) -> Dict[str, Any]:
    validate_inputs(PARAMETER_SCHEMA, inputs)

    return {
        "variableName": inputs["name"],
        "variableValue": inputs["value"]
    }
