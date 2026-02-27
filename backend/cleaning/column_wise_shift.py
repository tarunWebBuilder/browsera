import pandas as pd
from typing import Dict, Any
from utils import validate_inputs, logger

PARAMETER_SCHEMA = {
    "type": "object",
    "properties": {
        "dataframeRef": {"type": "string"},
        "columns": {
            "type": "array",
            "items": {"type": "string"}
        },
        "shiftAmount": {"type": "integer"}
    },
    "required": ["dataframeRef", "columns", "shiftAmount"]
}

def execute(inputs: Dict[str, Any], config: Dict[str, Any] = {}) -> Dict[str, Any]:
    validate_inputs(PARAMETER_SCHEMA, inputs)

    fill_value = config.get("fillValue")

    df = pd.DataFrame()
    try:
        for col in inputs["columns"]:
            df[col] = df[col].shift(inputs["shiftAmount"], fill_value=fill_value)
        new_ref = id(df)
    except Exception as e:
        logger.error(f"Column shift error: {str(e)}")
        new_ref = None

    return {"newDataframeRef": new_ref}
