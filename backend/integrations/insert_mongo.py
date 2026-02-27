import json
from typing import Dict, Any
from utils import validate_inputs, logger
from engine.session_store import SESSION_STORE
from pymongo import MongoClient
from engine.session_store import SESSION_STORE
from helper.parseObj import parse_documents
PARAMETER_SCHEMA = {
    "type": "object",
    "properties": {
        "sessionId": {"type": "string"},  # optional, to reuse connection
        "connectionConfig": {  # required if sessionId not provided
            "type": "object",
            "properties": {
                "uri": {"type": "string"}
            },
            "required": ["uri"]
        },
        "database": {"type": "string"},
        "collection": {"type": "string"},
        "document": {"type": "object"}
    },
    "required": ["database", "collection", "document"]
}

def execute(inputs: Dict[str, Any], config: Dict[str, Any] = {}):
    # validate_inputs(PARAMETER_SCHEMA, inputs)

    client = None
    print(inputs,'this is inputs','this is uri')
    # Reuse connection if session exists

    client = MongoClient('mongodb://localhost:27017/', serverSelectionTimeoutMS=3000)
    client.admin.command("ping")
    print('ping successful')
            # store in SESSION_STORE if sessionId provided

    db = client[inputs["database"]]
    coll = db[inputs["collection"]]
    s = inputs["document"]
    s = s.replace('\\"', '"')            # remove escape
    s = s.strip('"')                     # remove outer quotes
    s =  s.replace("} {", "},{")    # make it an array
    docs = json.loads(s)
    print(docs,'these are docs')

    try:
        result = coll.insert_many(docs)
        return {"success": True, "insertedId": str(result.inserted_id)}
    except Exception as e:
        logger.error(f"Insert failed: {str(e)}")
        return {"success": False, "error": str(e)}
