import pandas as pd
from typing import Dict, Any
from utils import validate_inputs, logger

PARAMETER_SCHEMA = {
    "type": "object",
    "properties": {
        "listRef": {"type": "string"},
        "columns": {"type": ["object", "null"]}
    },
    "required": ["listRef"]
}

def execute(inputs: Dict[str, Any], config: Dict[str, Any] = {}) -> Dict[str, Any]:
    validate_inputs(PARAMETER_SCHEMA, inputs)
    orientation = config.get("orientation", "records")
    type_casting = config.get("typeCasting", {})

    lst = []  # Restore from ref
    try:
        df = pd.DataFrame.from_records(lst) if orientation == "records" else pd.DataFrame(lst)
        # Apply type_casting
        obj_ref = id(df)
        length = len(df)
        columns = df.columns.tolist()
    except Exception as e:
        logger.error(f"List to DF error: {str(e)}")
        obj_ref = None
        length = 0
        columns = []

    return {"converted": obj_ref, "length": length, "columns": columns}