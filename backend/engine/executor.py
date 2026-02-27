import inspect
from engine.registry import ACTION_REGISTRY
from utils import logger

async def execute_action(action_id: str, inputs: dict, config: dict = {}):
    if action_id not in ACTION_REGISTRY:
        raise ValueError(f"Unknown action: {action_id}")

    action_func = ACTION_REGISTRY[action_id]

    try:
        # 🔥 detect sync vs async
        if inspect.iscoroutinefunction(action_func):
            result = await action_func(inputs, config)
        else:
            result = action_func(inputs, config)

        return {
            "status": "success",
            "actionId": action_id,
            "result": result,
        }

    except Exception as e:
        logger.error(str(e))
        return {
            "status": "failed",
            "actionId": action_id,
            "error": str(e),
        }
