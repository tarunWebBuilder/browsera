from pymilvus import connections
from typing import Dict, Any
from utils import validate_inputs, logger
from engine.session_store import SESSION_STORE

PARAMETER_SCHEMA = {
    "type": "object",
    "properties": {
        "connectionConfig": {
            "type": "object",
            "properties": {
                "host": {"type": "string"},
                "port": {"type": "integer"}
            },
            "required": ["host", "port"]
        }
    },
    "required": ["connectionConfig"]
}

def execute(inputs: Dict[str, Any], config: Dict[str, Any] = {}):
    validate_inputs(PARAMETER_SCHEMA, inputs)



    host = inputs["connectionConfig"]["host"]
    port = inputs["connectionConfig"]["port"]

    try:
        connections.connect(host=host, port=port)
        addr = connections.get_connection_addr("default")

        return {
            "connectionId": f"milvus_{host}_{port}",
            "testConnectionResult": {
                "connected": True,
                "address": addr
            }
        }
    except Exception as e:
        logger.error(str(e))
        return {
            "connectionId": None,
            "testConnectionResult": {"connected": False, "error": str(e)}
        }
