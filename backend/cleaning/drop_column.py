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
    inplace = config.get("inplace", False)
    preview = config.get("preview", True)

    df = pd.DataFrame()  # Restore
    if preview:
        logger.info(f"Preview: Would drop {inputs['columns']}")

    try:
        new_df = df.drop(columns=inputs["columns"], inplace=inplace)
        new_ref = id(df) if inplace else id(new_df)
        dropped_count = len(inputs["columns"])
    except Exception as e:
        logger.error(f"Drop column error: {str(e)}")
        new_ref = None
        dropped_count = 0

    return {"newDataframeRef": new_ref, "droppedCount": dropped_count}