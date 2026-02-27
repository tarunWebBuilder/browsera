from typing import Dict, Any
from utils import validate_inputs, logger
from engine.session_store import SESSION_STORE
from pymongo import MongoClient
from bson.objectid import ObjectId

PARAMETER_SCHEMA = {
    "type": "object",
    "properties": {
        "sessionId": {"type": "string"},
        "connectionConfig": {  
            "type": "object",
            "properties": {
                "uri": {"type": "string"}
            },
            "required": ["uri"]
        },
        "database": {"type": "string"},
        "collection": {"type": "string"},
        "documentId": {"type": "string"}
    },
    "required": ["database", "collection", "documentId"]
}

def execute(inputs: Dict[str, Any], config: Dict[str, Any] = {}):
    validate_inputs(PARAMETER_SCHEMA, inputs)


    session_id = config.get("sessionId")
    if not session_id or session_id not in SESSION_STORE:
        raise ValueError("Invalid or missing sessionId")



    client = None
    uri = inputs["connectionConfig"]["uri"]
    try:
            client = MongoClient(uri, serverSelectionTimeoutMS=3000)
            client.admin.command("ping")
            if session_id:
                SESSION_STORE[session_id] = {"mongoClient": client}
    except Exception as e:
            logger.error(f"Mongo connection failed: {str(e)}")
            return {"success": False, "error": str(e)}

    db = client[inputs["database"]]
    coll = db[inputs["collection"]]

    try:
        result = coll.delete_one({"_id": ObjectId(inputs["documentId"])})
        success = result.deleted_count > 0
        return {"success": success, "deletedCount": result.deleted_count}
    except Exception as e:
        logger.error(f"Delete failed: {str(e)}")
        return {"success": False, "error": str(e)}