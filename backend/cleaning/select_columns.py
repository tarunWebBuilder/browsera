import pandas as pd
from typing import Dict, Any
from utils import validate_inputs, logger

PARAMETER_SCHEMA = {
    "type": "object",
    "properties": {
        "dataframeRef": {"type": "string"},
        "columns": {"type": "array", "items": {"type": "string"}}
    },
    "required": ["dataframeRef", "columns"]
}

def execute(inputs: Dict[str, Any], config: Dict[str, Any] = {}) -> Dict[str, Any]:
    validate_inputs(PARAMETER_SCHEMA, inputs)
    fill_missing = config.get("fillMissing", None)

    df = pd.DataFrame()
    missing = []
    try:
        selected = df[inputs["columns"]]
        for col in inputs["columns"]:
            if col not in df.columns:
                missing.append(col)
                if fill_missing is not None:
                    selected[col] = fill_missing
        new_ref = id(selected)
    except Exception as e:
        logger.error(f"Select columns error: {str(e)}")
        new_ref = None

    return {"newDataframeRef": new_ref, "missingColumns": missing}