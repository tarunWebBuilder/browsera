from pymilvus import connections, Collection
from typing import Dict, Any
from utils import validate_inputs, logger
from engine.session_store import SESSION_STORE

PARAMETER_SCHEMA = {
    "type": "object",
    "properties": {
        "sessionId": {"type": "string"},  # optional
        "connectionConfig": {
            "type": "object",
            "properties": {
                "host": {"type": "string"},
                "port": {"type": "integer"}
            },
            "required": ["host", "port"]
        },
        "collectionName": {"type": "string"},
        "documents": {"type": "array"}  # list of dicts
    },
    "required": ["collectionName", "documents"]
}

def execute(inputs: Dict[str, Any], config: Dict[str, Any] = {}):
    validate_inputs(PARAMETER_SCHEMA, inputs)

    session_id = inputs.get("sessionId")
    client_connected = False

    # Connect if session doesn't exist
    if session_id and session_id in SESSION_STORE:
        client_connected = True
    else:
        host = inputs["connectionConfig"]["host"]
        port = inputs["connectionConfig"]["port"]
        try:
            connections.connect(alias="default", host=host, port=str(port))
            client_connected = True
            if session_id:
                SESSION_STORE[session_id] = {"milvus": True}
        except Exception as e:
            logger.error(f"Milvus connection failed: {str(e)}")
            return {"success": False, "error": str(e)}

    if not client_connected:
        return {"success": False, "error": "Unable to connect to Milvus"}

    collection_name = inputs["collectionName"]
    documents = inputs["documents"]

    try:
        collection = Collection(collection_name)
        collection.insert(documents)
        return {"success": True, "insertedCount": len(documents)}
    except Exception as e:
        logger.error(f"Milvus insert failed: {str(e)}")
        return {"success": False, "error": str(e)}
