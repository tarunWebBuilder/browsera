from typing import Dict, Any
from utils import validate_inputs

PARAMETER_SCHEMA = {
    "type": "object",
    "required": ["left", "operator", "right"],
    "properties": {
        "left": {"type": ["string", "number", "boolean"]},
        "operator": {
            "type": "string",
            "enum": ["==", "!=", ">", "<", ">=", "<="]
        },
        "right": {"type": ["string", "number", "boolean"]}
    }
}

def execute(inputs: Dict[str, Any], config: Dict[str, Any] = {}) -> Dict[str, Any]:
    validate_inputs(PARAMETER_SCHEMA, inputs)

    left = inputs["left"]
    right = inputs["right"]
    op = inputs["operator"]

    result = {
        "==": left == right,
        "!=": left != right,
        ">": left > right,
        "<": left < right,
        ">=": left >= right,
        "<=": left <= right,
    }[op]

    return {"conditionResult": result}
