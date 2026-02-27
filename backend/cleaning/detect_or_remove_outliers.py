import pandas as pd
from typing import Dict, Any
import numpy as np
from utils import validate_inputs, logger

PARAMETER_SCHEMA = {
    "type": "object",
    "properties": {
        "dataframeRef": {"type": "string"},
        "columns": {
            "type": "array",
            "items": {"type": "string"}
        }
    },
    "required": ["dataframeRef", "columns"]
}

def execute(inputs: Dict[str, Any], config: Dict[str, Any] = {}) -> Dict[str, Any]:
    validate_inputs(PARAMETER_SCHEMA, inputs)

    method = config.get("method", "iqr")
    threshold = config.get("threshold", 1.5)
    mode = config.get("mode", "remove")

    df = pd.DataFrame()
    outlier_indices = set()

    try:
        for col in inputs["columns"]:
            if method == "iqr":
                q1 = df[col].quantile(0.25)
                q3 = df[col].quantile(0.75)
                iqr = q3 - q1
                mask = (df[col] < q1 - threshold * iqr) | (df[col] > q3 + threshold * iqr)
            else:
                z = (df[col] - df[col].mean()) / df[col].std()
                mask = z.abs() > threshold

            outlier_indices.update(df[mask].index.tolist())

        if mode == "remove":
            df = df.drop(index=outlier_indices)

        new_ref = id(df)

    except Exception as e:
        logger.error(f"Outlier detection error: {str(e)}")
        new_ref = None

    return {
        "newDataframeRef": new_ref,
        "outliersCount": len(outlier_indices)
    }
