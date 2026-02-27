from sqlalchemy import create_engine, text
from typing import Dict, Any
from utils import validate_inputs, logger

PARAMETER_SCHEMA = {
    "type": "object",
    "properties": {
        "connectionConfig": {"type": "object", "properties": {
            "host": {"type": "string"},
            "port": {"type": "integer"},
            "userRef": {"type": "string"},  # secret ref
            "dbName": {"type": "string"},
            "driver": {"type": "string"}
        }},
    },
    "required": ["connectionConfig"]
}

def execute(inputs: Dict[str, Any], config: Dict[str, Any] = {}) -> Dict[str, Any]:
    validate_inputs(PARAMETER_SCHEMA, inputs)
    pool = config.get("connectionPool", True)
    ssl = config.get("ssl", False)

    conn_config = inputs["connectionConfig"]
    # Resolve secrets: Placeholder, assume userRef is username, add password from vault
    password = "resolved_secret"  # From vault

    driver = conn_config["driver"]
    url = f"{driver}://{conn_config['userRef']}:{password}@{conn_config['host']}:{conn_config['port']}/{conn_config['dbName']}"
    if ssl:
        url += "?sslmode=require"

    try:
        engine = create_engine(url, pool_pre_ping=pool)
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))  # Test
        connection_id = "conn_" + hash(url)  # Placeholder
        test_result = {"connected": True}
    except Exception as e:
        logger.error(f"Add DB error: {str(e)}")
        connection_id = None
        test_result = {"connected": False, "error": str(e)}

    return {"connectionId": connection_id, "testConnectionResult": test_result}