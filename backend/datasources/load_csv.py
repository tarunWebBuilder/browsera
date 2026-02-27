import pandas as pd
from typing import Dict, Any
from utils import validate_inputs, logger

PARAMETER_SCHEMA = {
    "type": "object",
    "properties": {
        "fileRef": {"type": "string"},
        "delimiter": {"type": "string"}
    },
    "required": ["fileRef"]
}

def execute(inputs: Dict[str, Any], config: Dict[str, Any] = {}) -> Dict[str, Any]:
    validate_inputs(PARAMETER_SCHEMA, inputs)
    header_row = config.get("headerRow", True)
    encoding = config.get("encoding", "utf-8")
    chunk_size = config.get("chunkSize", 10000)

    try:
        df = pd.read_csv(inputs["fileRef"], delimiter=inputs.get("delimiter", ","), header=0 if header_row else None, encoding=encoding, chunksize=chunk_size)
        df = next(df) if chunk_size else df  # Stream if large
        df_ref = id(df)
        row_count = len(df)
        columns = df.columns.tolist()
    except Exception as e:
        logger.error(f"Load CSV error: {str(e)}")
        df_ref = None
        row_count = 0
        columns = []

    return {"dataframeRef": df_ref, "rowCount": row_count, "columns": columns}