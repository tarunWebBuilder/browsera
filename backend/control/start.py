from typing import Dict, Any

PARAMETER_SCHEMA = {
    "type": "object",
    "properties": {}
}

def execute(inputs: Dict[str, Any], config: Dict[str, Any] = {}) -> Dict[str, Any]:
    # No-op entry node
    return {"status": "started"}
