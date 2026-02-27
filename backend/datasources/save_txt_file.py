from typing import Dict, Any
from utils import validate_inputs, logger

PARAMETER_SCHEMA = {
    "type": "object",
    "properties": {
        "fileRef": {"type": "string"},
        "data": {"type": "string"}
    },
    "required": ["data"]
}

def execute(inputs: Dict[str, Any], config: Dict[str, Any] = {}) -> Dict[str, Any]:
    validate_inputs(PARAMETER_SCHEMA, inputs)
    encoding = config.get("encoding", "utf-8")

    try:
        with open(inputs.get("fileRef", "output.txt"), "w", encoding=encoding) as f:
            f.write(inputs["data"])
        saved_ref = inputs.get("fileRef")
    except Exception as e:
        logger.error(f"Save TXT error: {str(e)}")
        saved_ref = None

    return {"savedFileRef": saved_ref}