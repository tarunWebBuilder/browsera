import pandas as pd
from typing import Dict, Any
from utils import validate_inputs, logger

PARAMETER_SCHEMA = {
    "type": "object",
    "properties": {
        "dataframeRef": {"type": "string"},
        "columnName": {"type": "string"},
        "value": {"type": ["string", "number", "boolean"]}
    },
    "required": ["dataframeRef", "columnName", "value"]
}

def execute(inputs: Dict[str, Any], config: Dict[str, Any] = {}) -> Dict[str, Any]:
    validate_inputs(PARAMETER_SCHEMA, inputs)
    type_cast = config.get("typeCast", None)
    position = config.get("position", None)

    df = pd.DataFrame()
    try:
        if inputs["columnName"] in df.columns:
            raise ValueError("Column name conflict")
        df[inputs["columnName"]] = inputs["value"]
        if type_cast:
            df[inputs["columnName"]] = df[inputs["columnName"]].astype(type_cast)
        if position is not None:
            cols = df.columns.tolist()
            cols = cols[:position] + [inputs["columnName"]] + cols[position:]
            df = df[cols]
        new_ref = id(df)
    except Exception as e:
        logger.error(f"Add constant column error: {str(e)}")
        new_ref = None

    return {"newDataframeRef": new_ref}