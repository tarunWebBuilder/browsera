import pandas as pd
from typing import Dict, Any
from utils import validate_inputs, logger

PARAMETER_SCHEMA = {
    "type": "object",
    "properties": {
        "dataframeRef": {"type": "string"},
        "columns": {"type": ["object", "null"]}
    },
    "required": ["dataframeRef"]
}

def execute(inputs: Dict[str, Any], config: Dict[str, Any] = {}) -> Dict[str, Any]:
    validate_inputs(PARAMETER_SCHEMA, inputs)
    orientation = config.get("orientation", "records")
    type_casting = config.get("typeCasting", {})

    df = pd.DataFrame()  # Restore from ref
    try:
        converted = df.to_dict(orient=orientation)
        # Apply type_casting if needed
        length = len(converted)
        columns = df.columns.tolist()
        obj_ref = id(converted)
    except Exception as e:
        logger.error(f"DF to list error: {str(e)}")
        converted = []
        length = 0
        columns = []
        obj_ref = None

    return {"converted": obj_ref, "length": length, "columns": columns}  # Renamed for clarity