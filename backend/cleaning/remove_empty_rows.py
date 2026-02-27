import pandas as pd
from typing import Dict, Any
from utils import validate_inputs, logger

PARAMETER_SCHEMA = {
    "type": "object",
    "properties": {
        "dataframeRef": {"type": "string"}
    },
    "required": ["dataframeRef"]
}

def execute(inputs: Dict[str, Any], config: Dict[str, Any] = {}) -> Dict[str, Any]:
    validate_inputs(PARAMETER_SCHEMA, inputs)

    how = config.get("how", "any")

    df = pd.DataFrame()
    try:
        before = len(df)
        new_df = df.dropna(how=how)
        removed = before - len(new_df)
        new_ref = id(new_df)
    except Exception as e:
        logger.error(f"Remove empty rows error: {str(e)}")
        new_ref = None
        removed = 0

    return {"newDataframeRef": new_ref, "removedCount": removed}
