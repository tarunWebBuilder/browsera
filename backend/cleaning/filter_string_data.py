import pandas as pd
from typing import Dict, Any
from utils import validate_inputs, logger

PARAMETER_SCHEMA = {
    "type": "object",
    "properties": {
        "dataframeRef": {"type": "string"},
        "column": {"type": "string"},
        "condition": {"type": "string", "enum": ["contains", "startsWith", "regex", "equals"]}
    },
    "required": ["dataframeRef", "column", "condition"]
}

def execute(inputs: Dict[str, Any], config: Dict[str, Any] = {}) -> Dict[str, Any]:
    validate_inputs(PARAMETER_SCHEMA, inputs)
    negate = config.get("negate", False)

    df = pd.DataFrame()
    try:
        if inputs["condition"] == "contains":
            mask = df[inputs["column"]].str.contains(inputs.get("value", ""), case=False)
        elif inputs["condition"] == "startsWith":
            mask = df[inputs["column"]].str.startswith(inputs.get("value", ""))
        elif inputs["condition"] == "regex":
            mask = df[inputs["column"]].str.match(inputs.get("value", ""))
        elif inputs["condition"] == "equals":
            mask = df[inputs["column"]] == inputs.get("value")
        if negate:
            mask = ~mask
        filtered = df[mask]
        new_ref = id(filtered)
        count = len(filtered)
    except Exception as e:
        logger.error(f"Filter string error: {str(e)}")
        new_ref = None
        count = 0

    return {"filteredDataframeRef": new_ref, "count": count}