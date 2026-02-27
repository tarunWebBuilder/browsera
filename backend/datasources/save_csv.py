import pandas as pd
from typing import Dict, Any
from utils import validate_inputs, logger

PARAMETER_SCHEMA = {
    "type": "object",
    "properties": {
        "dataframeRef": {"type": "string"},
        "destinationRef": {"type": "string"},
        "format": {"type": "string"}
    },
    "required": ["destinationRef"]
}

def execute(inputs: Dict[str, Any], config: Dict[str, Any] = {}) -> Dict[str, Any]:
    validate_inputs(PARAMETER_SCHEMA, inputs)
    include_index = config.get("includeIndex", False)
    compression = config.get("compression", None)
    delimiter = config.get("delimiter", ",")

    df = pd.DataFrame()  # Restore
    try:
        df.to_csv(inputs["destinationRef"], index=include_index, compression=compression, sep=delimiter)
        file_ref = inputs["destinationRef"]
        bytes_size = df.memory_usage().sum()
        success = True
    except Exception as e:
        logger.error(f"Save CSV error: {str(e)}")
        file_ref = None
        bytes_size = 0
        success = False

    return {"fileRef": file_ref, "bytes": bytes_size, "success": success}