from pymongo import MongoClient
from typing import Dict, Any
from utils import validate_inputs, logger
from engine.session_store import SESSION_STORE
import uuid
import hashlib

PARAMETER_SCHEMA = {
    "type": "object",
    "properties": {
        "connectionConfig": {
            "type": "object",
            "properties": {
                "uri": {"type": "string"}
            },
            "required": ["uri"]
        }
    },
    "required": ["connectionConfig"]
}

def execute(inputs: Dict[str, Any], config: Dict[str, Any] = {}):
    validate_inputs(PARAMETER_SCHEMA, inputs)

    uri = inputs["connectionConfig"]["uri"]

    try:
        client = MongoClient(uri, serverSelectionTimeoutMS=3000)
        client.admin.command("ping")

        session_id = str(uuid.uuid4())

        SESSION_STORE[session_id] = {
            "mongoClient": client,
            "mongoUri": uri
        }

        return {
       
            "connectionId": "mongo_" + hashlib.sha256(uri.encode()).hexdigest()[:10],
            "testConnectionResult": {"connected": True}
        }

    except Exception as e:
        logger.error(str(e))
        return {
            "connectionId": None,
            "testConnectionResult": {"connected": False, "error": str(e)}
        }
