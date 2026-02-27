import pandas as pd
from typing import Dict, Any
from utils import validate_inputs, logger

PARAMETER_SCHEMA = {
    "type": "object",
    "properties": {
        "dataframeRef": {"type": "string"},
        "by": {
            "type": "array",
            "items": {"type": "string"}
        }
    },
    "required": ["dataframeRef", "by"]
}

def execute(inputs: Dict[str, Any], config: Dict[str, Any] = {}) -> Dict[str, Any]:
    validate_inputs(PARAMETER_SCHEMA, inputs)

    order = config.get("order", "asc")
    ascending = order == "asc"

    df = pd.DataFrame()
    try:
        new_df = df.sort_values(by=inputs["by"], ascending=ascending)
        new_ref = id(new_df)
    except Exception as e:
        logger.error(f"Sort data error: {str(e)}")
        new_ref = None

    return {"newDataframeRef": new_ref}
