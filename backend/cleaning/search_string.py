import pandas as pd
from typing import Dict, Any
from utils import validate_inputs, logger
import re

PARAMETER_SCHEMA = {
    "type": "object",
    "properties": {
        "dataframeRef": {"type": "string"},
        "columns": {"type": "array", "items": {"type": "string"}},
        "pattern": {"type": "string"}
    },
    "required": ["dataframeRef", "pattern"]
}

def execute(inputs: Dict[str, Any], config: Dict[str, Any] = {}) -> Dict[str, Any]:
    validate_inputs(PARAMETER_SCHEMA, inputs)
    is_regex = config.get("regex", False)
    return_context = config.get("returnContext", False)

    df = pd.DataFrame()
    matches = []
    try:
        for col in inputs.get("columns", df.columns):
            mask = df[col].str.contains(inputs["pattern"], regex=is_regex)
            matched_rows = df[mask].index.tolist()
            if return_context:
                matches.extend([(row, df.loc[row, col]) for row in matched_rows])
            else:
                matches.extend(matched_rows)
        matches = matches[:1000]  # Limit
    except Exception as e:
        logger.error(f"Search string error: {str(e)}")
        matches = []

    return {"matches": matches}