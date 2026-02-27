import json
import re
from typing import Any, List, Union

def parse_documents(doc_input: Any) -> Union[dict, List[dict]]:
    """
    Accepts:
    - dict (single doc) -> returns dict
    - list[dict]        -> returns list
    - string containing:
        - single JSON object
        - JSON array
        - multiple objects concatenated like: {...} {...} {...}
      -> returns dict or list[dict]
    """
    if isinstance(doc_input, dict) or isinstance(doc_input, list):
        return doc_input

    if not isinstance(doc_input, str):
        raise ValueError("Document must be an object, array, or JSON string")

    s = doc_input.strip()

    # If it's quoted JSON (string starts/ends with quotes), try to unescape once
    if (s.startswith('"') and s.endswith('"')) or (s.startswith("'") and s.endswith("'")):
        try:
            s = json.loads(s)  # removes outer quotes and unescapes
        except Exception:
            s = s[1:-1]

    # 1) Try parse as JSON object or array
    try:
        parsed = json.loads(s)
        return parsed
    except Exception:
        pass

    # 2) Handle concatenated objects: {...} {...} {...}
    # Extract each {...} block
    objs = re.findall(r'\{(?:[^{}]|(?R))*\}', s)  # recursive brace match (works in some regex engines)
    if not objs:
        # fallback simpler split for basic cases
        objs = re.findall(r'\{.*?\}', s, flags=re.DOTALL)

    docs = []
    for obj in objs:
        try:
            docs.append(json.loads(obj))
        except Exception as e:
            raise ValueError(f"Failed to parse JSON object: {obj[:50]}... Error: {e}")

    if not docs:
        raise ValueError("No valid JSON documents found")

    return docs
