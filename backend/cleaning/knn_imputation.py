import pandas as pd
from typing import Dict, Any
from sklearn.impute import KNNImputer
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

    k = config.get("k", 5)

    df = pd.DataFrame()
    try:
        imputer = KNNImputer(n_neighbors=k)
        before = df[inputs["columns"]].isna().sum().sum()
        df[inputs["columns"]] = imputer.fit_transform(df[inputs["columns"]])
        after = df[inputs["columns"]].isna().sum().sum()
        new_ref = id(df)
    except Exception as e:
        logger.error(f"KNN imputation error: {str(e)}")
        new_ref = None
        before = after = 0

    return {
        "newDataframeRef": new_ref,
        "imputedCount": before - after
    }
