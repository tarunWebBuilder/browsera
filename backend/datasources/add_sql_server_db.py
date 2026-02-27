from typing import Dict, Any
from .add_database import execute as add_db_execute

# Reuse, assume driver like mssql+pyodbc
def execute(inputs: Dict[str, Any], config: Dict[str, Any] = {}) -> Dict[str, Any]:
    inputs["connectionConfig"]["driver"] = "mssql+pyodbc"  # Need odbc driver
    result = add_db_execute(inputs, config)
    result["capabilityFlags"] = {"sql_server_specific": True}
    return result