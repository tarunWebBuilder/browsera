from typing import Dict, Any
from utils import validate_inputs, logger

PARAMETER_SCHEMA = {
    "type": "object",
    "properties": {
        "fileRef": {"type": "string"},
        "data": {"type": ["string", "null"]}
    }
}

def execute(inputs: Dict[str, Any], config: Dict[str, Any] = {}) -> Dict[str, Any]:
    validate_inputs(PARAMETER_SCHEMA, inputs)
    encoding = config.get("encoding", "utf-8")
    max_length = config.get("maxLength", 1048576)

    try:
        with open(inputs.get("fileRef", ""), "r", encoding=encoding) as f:
            content = f.read()[:max_length]
    except Exception as e:
        logger.error(f"Load TXT error: {str(e)}")
        content = ""

    return {"textContent": content}