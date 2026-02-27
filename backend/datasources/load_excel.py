import pandas as pd
from typing import Dict, Any
from utils import validate_inputs, logger

PARAMETER_SCHEMA = {
    "type": "object",
    "properties": {
        "fileRef": {"type": "string"},
        "sheetName": {"type": ["string", "null"]}
    },
    "required": ["fileRef"]
}

def execute(inputs: Dict[str, Any], config: Dict[str, Any] = {}) -> Dict[str, Any]:
    validate_inputs(PARAMETER_SCHEMA, inputs)
    header_row = config.get("headerRow", True)
    encoding = config.get("encoding", "utf-8")
    chunk_size = config.get("chunkSize", 10000)

    try:
        df = pd.read_excel(inputs["fileRef"], sheet_name=inputs.get("sheetName", 0), header=0 if header_row else None, engine="openpyxl")
        df_ref = id(df)  # Placeholder ref
        row_count = len(df)
        columns = df.columns.tolist()
    except Exception as e:
        logger.error(f"Load Excel error: {str(e)}")
        df_ref = None
        row_count = 0
        columns = []

    return {"dataframeRef": df_ref, "rowCount": row_count, "columns": columns}