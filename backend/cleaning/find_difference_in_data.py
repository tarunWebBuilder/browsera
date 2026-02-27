import pandas as pd
from typing import Dict, Any
from utils import validate_inputs, logger

PARAMETER_SCHEMA = {
    "type": "object",
    "properties": {
        "leftDataframeRef": {"type": "string"},
        "rightDataframeRef": {"type": "string"},
        "keyColumns": {
            "type": "array",
            "items": {"type": "string"}
        }
    },
    "required": ["leftDataframeRef", "rightDataframeRef", "keyColumns"]
}

def execute(inputs: Dict[str, Any], config: Dict[str, Any] = {}) -> Dict[str, Any]:
    validate_inputs(PARAMETER_SCHEMA, inputs)

    left_df = pd.DataFrame()
    right_df = pd.DataFrame()

    try:
        left_only = left_df.merge(
            right_df,
            on=inputs["keyColumns"],
            how="left",
            indicator=True
        ).query('_merge == "left_only"')

        right_only = right_df.merge(
            left_df,
            on=inputs["keyColumns"],
            how="left",
            indicator=True
        ).query('_merge == "left_only"')

    except Exception as e:
        logger.error(f"Find difference error: {str(e)}")
        left_only = right_only = pd.DataFrame()

    return {
        "leftOnlyCount": len(left_only),
        "rightOnlyCount": len(right_only)
    }
