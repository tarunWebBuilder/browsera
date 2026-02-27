import pandas as pd
from typing import Dict, Any
from utils import validate_inputs, logger
import re

PARAMETER_SCHEMA = {
    "type": "object",
    "properties": {
        "dataframeRef": {"type": "string"},
        "column": {"type": "string"},
        "pattern": {"type": "string"},
        "replacement": {"type": "string"}
    },
    "required": ["dataframeRef", "column", "pattern", "replacement"]
}

def execute(inputs: Dict[str, Any], config: Dict[str, Any] = {}) -> Dict[str, Any]:
    validate_inputs(PARAMETER_SCHEMA, inputs)
    regex_flags = config.get("regexFlags", re.IGNORECASE)
    case_sensitive = config.get("caseSensitive", True)
    flags = 0 if case_sensitive else re.IGNORECASE | regex_flags

    df = pd.DataFrame()
    try:
        matches = df[inputs["column"]].str.count(inputs["pattern"], flags=flags)
        matches_count = matches.sum()
        df[inputs["column"]] = df[inputs["column"]].str.replace(inputs["pattern"], inputs["replacement"], regex=True, flags=flags)
        new_ref = id(df)
    except Exception as e:
        logger.error(f"Replace string error: {str(e)}")
        new_ref = None
        matches_count = 0

    return {"newDataframeRef": new_ref, "matchesCount": matches_count}