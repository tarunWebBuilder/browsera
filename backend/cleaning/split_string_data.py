# cleaning/split_string_data.py
from typing import Dict, Any
from utils import validate_inputs, logger

PARAMETER_SCHEMA = {
    "type": "object",
    "properties": {
        "dataframeRef": {"type": "string"},
        "column": {"type": "string"},
        "delimiter": {"type": "string"}
    },
    "required": ["dataframeRef", "column"]
}

def execute(inputs: Dict[str, Any], config: Dict[str, Any] = {}) -> Dict[str, Any]:
    """
    Splits a string column in a dataframe into a list of strings based on a delimiter.
    """
    validate_inputs(PARAMETER_SCHEMA, inputs)

    delimiter = config.get("delimiter", ",")
    df = None  # Replace with actual dataframe retrieval using inputs["dataframeRef"]
    new_ref = None

    try:
        if df is not None and inputs["column"] in df.columns:
            # Split the column values
            df[inputs["column"]] = df[inputs["column"]].astype(str).apply(lambda x: x.split(delimiter))
            new_ref = id(df)
        else:
            logger.error(f"Column {inputs['column']} not found in dataframe")
    except Exception as e:
        logger.error(f"Split string data error: {str(e)}")
        new_ref = None

    return {"newDataframeRef": new_ref}
