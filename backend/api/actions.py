from fastapi import APIRouter
from engine.executor import execute_action

router = APIRouter(prefix="/actions", tags=["actions"])

@router.post("/execute")
def run_action(payload: dict):
    """
    payload = {
      "actionId": "renameColumn",
      "inputs": {...},
      "config": {...}
    }
    """
    return execute_action(
        payload["actionId"],
        payload.get("inputs", {}),
        payload.get("config", {})
    )
