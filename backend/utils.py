import jsonschema
import logging
from typing import Dict, Any

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def validate_inputs(schema: Dict[str, Any], inputs: Dict[str, Any]):
    try:
        jsonschema.validate(instance=inputs, schema=schema)
    except jsonschema.exceptions.ValidationError as e:
        raise ValueError(f"Input validation failed: {e.message}")

def safe_eval(expr: str, context: Dict[str, Any]):
    # Placeholder for RestrictedPython sandbox
    from RestrictedPython import compile_restricted_exec
    result = compile_restricted_exec(expr)
    if result.errors:
        raise ValueError(f"Safe eval failed: {result.errors}")
    exec(result.code, context)
    return context.get('result')  # Assume expr sets 'result'