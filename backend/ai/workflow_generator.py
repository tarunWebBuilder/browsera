import json
import os
import uuid
from typing import Any, Dict, List, Sequence

from fastapi import HTTPException

try:
    from mistralai import Mistral
except ImportError as exc:
    _MISTRAL_IMPORT_ERROR = exc
else:
    _MISTRAL_IMPORT_ERROR = None

MODEL_NAME = os.environ.get("MISTRAL_MODEL", "mistral-medium-latest")

ACTION_SECTIONS: Dict[str, Sequence[str]] = {
    "cleaning": [
        "dropColumn",
        "renameColumn",
        "selectColumns",
        "addConstantColumn",
        "replaceString",
        "searchString",
        "filterStringData",
        "splitStringData",
        "sortData",
        "removeDuplicates",
        "removeEmptyRows",
        "knnImputation",
        "findDifference",
        "outliers",
        "columnShift",
    ],
    "datasources": [
        "addDatabase",
        "addMysqlDb",
        "addSqlServerDb",
        "loadCSV",
        "loadExcel",
        "loadJsonFile",
        "loadTxtFile",
        "saveCSV",
        "saveExcel",
        "saveJsonFile",
        "saveTxtFile",
        "getApiRest",
        "postApiRest",
        "dataframeToList",
        "listToDataframe",
        "connectMongo",
        "insertMongo",
        "deleteMongo",
        "connectMilvus",
        "insertMilvus",
        "deleteMilvus",
    ],
    "webscraping": [
        "openBrowser",
        "loadWebsite",
        "refreshPageSource",
        "click",
        "clickId",
        "clickName",
        "clickXPath",
        "write",
        "useKey",
        "wait",
        "scanWebPage",
        "extractXPath",
        "extractMultipleXPaths",
        "getCurrentUrl",
        "closeBrowser",
    ],
    "control": [
        "addVariable",
    ],
    "misc": [
        "fetchText",
        "analyzeSite",
        "pdfTomarkdown",
    ],
}

ACTION_SUMMARY = "\n".join(
    f"{section.title()} actions: {', '.join(actions)}"
    for section, actions in ACTION_SECTIONS.items()
)

SYSTEM_PROMPT = f"""
You are an agentic workflow architect. Your job is to translate a user goal into a list of nodes that rely only on the actions listed in the registry below. Each node must obey the Node interface:
- `id`: unique string (UUIDs like `node-1` or a uuid4 are ok)
- `type`: one of `trigger`, `action`, `logic`, or `finish`
- `variant`: must match the ActionSection (e.g. `webscraping`, `datasources`, `cleaning`, `control`) associated with the action, or `null` if it is a generic node
- `label`: short human-friendly name
- `x`/`y`: layout coordinates (use 150–200 pixel steps)
- `actionTemplateId`: one of the action ids below when the node executes an action
- `inputs`: describe parameters (e.g. `{{ "url": "https://example.com" }}`)
- `config`: can mirror `inputs` or expand on configuration details
- `status`, `outputs`, `meta`: optional
Use `trigger` for the first node and `finish` for the final node when the goal describes a complete workflow. Do not invent new action ids or stray outside the list. Each node that performs an action must reference an `actionTemplateId` from the registry and place that action in a logical order. Keep the response strictly as JSON and never wrap it in markdown or prose. If you cannot satisfy the prompt return an empty `nodes` array.
{ACTION_SUMMARY}
"""


def _strip_code_fences(content: str) -> str:
    cleaned = content.strip()
    if cleaned.startswith("```") and "```" in cleaned[3:]:
        _, after = cleaned.split("```", 1)
        cleaned = after.strip()
    return cleaned


def _ensure_client() -> Mistral:
    if _MISTRAL_IMPORT_ERROR:
        raise HTTPException(
            status_code=500,
            detail="The `mistralai` library is not installed on the server.",
        )

    api_key = os.environ.get("MISTRAL_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="Missing MISTRAL_API_KEY environment variable")

    try:
        return Mistral(api_key=api_key)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Unable to reach Mistral: {exc}")


def _get_completion_content(response: Any) -> str:
    def _message_from_choice(choice: Any) -> Dict[str, Any]:
        message = getattr(choice, "message", None)
        if message is None and isinstance(choice, dict):
            message = choice.get("message")
        if message is None:
            raise HTTPException(502, detail="Mistral choice missing a message")
        if isinstance(message, dict):
            return message
        return {"content": getattr(message, "content", "")}

    choices = None
    if hasattr(response, "choices"):
        choices = list(response.choices)
    elif isinstance(response, dict):
        choices = response.get("choices")

    if not choices:
        raise HTTPException(502, detail="Mistral returned no choices")

    message = _message_from_choice(choices[0])
    return _strip_code_fences(message.get("content", ""))


def _extract_nodes(parsed: Any) -> List[Dict[str, Any]]:
    if isinstance(parsed, dict):
        nodes = parsed.get("nodes")
        if isinstance(nodes, list):
            return nodes
        workflow = parsed.get("workflow")
        if isinstance(workflow, dict) and isinstance(workflow.get("nodes"), list):
            return workflow["nodes"]
    if isinstance(parsed, list):
        return parsed
    raise HTTPException(502, detail="Mistral response did not include a nodes list")


def _normalize_nodes(raw_nodes: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    normalized = []
    for index, node in enumerate(raw_nodes):
        if not isinstance(node, dict):
            continue
        normalized_node = {
            "id": node.get("id") or node.get("actionTemplateId") or str(uuid.uuid4()),
            "workflowId": node.get("workflowId"),
            "type": node.get("type", "action"),
            "variant": node.get("variant"),
            "label": node.get("label") or node.get("actionTemplateId") or "AI node",
            "x": node.get("x", 120 + index * 180),
            "y": node.get("y", 120),
            "icon": node.get("icon"),
            "actionTemplateId": node.get("actionTemplateId"),
            "inputs": node.get("inputs", {}),
            "outputs": node.get("outputs", {}),
            "meta": node.get("meta", {}),
            "status": node.get("status", "idle"),
            "config": node.get("config", node.get("inputs", {})),
        }
        normalized.append(normalized_node)
    return normalized


def generate_workflow_nodes(prompt: str, workflow_name: str | None = None, user_email: str | None = None) -> List[Dict[str, Any]]:
    if not prompt or not prompt.strip():
        raise HTTPException(status_code=400, detail="Prompt must not be empty")

    client = _ensure_client()
    user_context = f"Workflow name: {workflow_name or 'Unnamed workflow'}\n" + (
        f"Requested by: {user_email}\n"
        if user_email
        else ""
    )
    user_message = (
        f"User goal: {prompt.strip()}\n"
        f"{user_context}"
        "Return only a JSON object with a `nodes` array."
    )

    try:
        response = client.chat.complete(
            model=MODEL_NAME,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_message},
            ],
            temperature=0.4,
            max_tokens=1000,
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Mistral request failed: {exc}")

    content = _get_completion_content(response)

    try:
        parsed = json.loads(content)
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=502, detail=f"Unable to parse Mistral output: {exc}")

    nodes = _extract_nodes(parsed)
    return _normalize_nodes(nodes)
