import requests
from typing import Dict, Any
from utils import validate_inputs, logger

PARAMETER_SCHEMA = {
    "type": "object",
    "properties": {
        "url": {"type": "string"},
        "method": {"type": "string", "enum": ["POST", "PUT", "DELETE"]},
        "body": {"type": "object"},
        "headers": {"type": "object"},
        "authRef": {"type": "string"}
    },
    "required": ["url", "method"]
}

def execute(inputs: Dict[str, Any], config: Dict[str, Any] = {}) -> Dict[str, Any]:
    validate_inputs(PARAMETER_SCHEMA, inputs)
    content_type = config.get("contentType", "application/json")
    timeout = config.get("timeout", 30)
    retry = config.get("retry", 3)

    # Confirmation for destructive: Placeholder, assume confirmed
    method = getattr(requests, inputs["method"].lower())
    headers = inputs.get("headers", {})
    headers["Content-Type"] = content_type
    auth = None  # Resolve

    for attempt in range(retry):
        try:
            response = method(inputs["url"], json=inputs.get("body") if content_type == "application/json" else inputs.get("body"), headers=headers, auth=auth, timeout=timeout)
            response.raise_for_status()
            body = response.json() if "json" in response.headers.get("Content-Type", "") else response.text
            return {"status": response.status_code, "responseBody": body}
        except requests.exceptions.RequestException as e:
            logger.warning(f"{inputs['method']} API attempt {attempt+1} failed: {str(e)}")
    return {"status": 500, "responseBody": ""}