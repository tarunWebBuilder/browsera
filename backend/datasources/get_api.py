import requests
from typing import Dict, Any
from utils import validate_inputs, logger

PARAMETER_SCHEMA = {
    "type": "object",
    "properties": {
        "url": {"type": "string"},
        "headers": {"type": "object"},
        "queryParams": {"type": "object"},
        "authRef": {"type": "string"}
    },
    "required": ["url"]
}

def execute(inputs: Dict[str, Any], config: Dict[str, Any] = {}) -> Dict[str, Any]:
    validate_inputs(PARAMETER_SCHEMA, inputs)
    timeout = config.get("timeout", 30)
    retry = config.get("retry", 3)
    response_limit = config.get("responseLimit", 1048576)  # 1MB

    auth = ("user", "pass") if inputs.get("authRef") else None  # Resolve from vault

    for attempt in range(retry):
        try:
            response = requests.get(inputs["url"], params=inputs.get("queryParams", {}), headers=inputs.get("headers", {}), auth=auth, timeout=timeout)
            response.raise_for_status()
            body = response.json() if "json" in response.headers.get("Content-Type", "") else response.text[:response_limit]
            return {"statusCode": response.status_code, "body": body, "headers": dict(response.headers)}
        except requests.exceptions.RequestException as e:
            logger.warning(f"GET API attempt {attempt+1} failed: {str(e)}")
    return {"statusCode": 500, "body": "", "headers": {}}