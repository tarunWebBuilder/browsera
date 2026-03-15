from typing import Dict, Any, List, Optional

from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from api.actions import router as action_router
from engine.executor import execute_action
from ai.workflow_generator import generate_workflow_nodes


# FastAPI imports
from fastapi import (
    FastAPI,
    HTTPException,
    UploadFile,
    File,
    Form,
)

# Stdlib imports
import tempfile
import shutil
import os


from db import users_collection
from workflow_store import get_workflow, list_workflows, save_workflow

from auth import hash_password, verify_password, create_access_token

from fastapi import Depends

from debs import get_current_user

class SignUpPayload(BaseModel):
    email: str
    password: str


class SignInPayload(BaseModel):
    email: str
    password: str


class WorkflowPayload(BaseModel):
    workflowId: Optional[str] = None
    name: str
    nodes: List[Dict[str, Any]]


class WorkflowGenerationPayload(BaseModel):
    prompt: str
    workflowName: str | None = None





app = FastAPI(title="Workflow Engine")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*","http://localhost:3001"],  # frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Payload schema
class RunNodePayload(BaseModel):
    actionId: str
    label: Optional[str] = None
    inputs: Dict[str, Any]
    config: Dict[str, Any] = {}  # optional

@app.post("/run-node")
async def run_node(payload: RunNodePayload):
    try:
        print(payload)
        result =await execute_action(payload.actionId, payload.inputs, payload.config)
        return result
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/run-multiple-nodes")
async def run_multiple_nodes(payload: dict):
    nodes = payload.get("nodes", [])
    results = []
    print(nodes)
    for node in nodes:
        try:
            result = await execute_action(
                node["actionTemplateId"],   # actionId
                node.get("inputs", {}),     # inputs
                node.get("config", {})      # config
            )

            results.append({
                "nodeId": node["id"],
                "status": "success",
                "result": result,
            })

        except Exception as e:
            results.append({
                "nodeId": node["id"],
                "status": "failed",
                "error": str(e),
            })

    return { "results": results }


@app.post("/pdf/upload-to-markdown")
async def upload_pdf_to_markdown(
    file: UploadFile = File(...),
    maxChars: int = Form(30000),
    returnMarkdown: bool = Form(True),
    useOCR: bool = Form(False),
    ocrMaxPages: int = Form(5),
):
    # Basic validation
    if file.content_type != "application/pdf":
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are supported"
        )

    # Save uploaded file to temp location (SERVER filesystem)
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        shutil.copyfileobj(file.file, tmp)
        temp_path = tmp.name
        actionId="pdfTomarkdown"
        config= {}
        inputs={"source": temp_path,"maxChars": maxChars,"returnMarkdown": returnMarkdown,"useOCR": useOCR,"ocrMaxPages": ocrMaxPages,}
    try:
        # Reuse the SAME core logic
        result = await execute_action(actionId ,inputs,config)
        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        try:
            os.remove(temp_path)
        except Exception:
            pass


@app.post("/signup")
def signup(payload: SignUpPayload):
    print('war started')
    if users_collection.find_one({"email": payload.email}):
        raise HTTPException(status_code=400, detail="User already exists")

    users_collection.insert_one({
        "email": payload.email,
        "password": hash_password(payload.password),
    })

    return {"message": "Signup successful"}


@app.post("/signin")
def signin(payload: SignInPayload):
    user = users_collection.find_one({"email": payload.email})
   
    if not user or not verify_password(payload.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({"email": payload.email})
    
    
    return {
        "access_token": token,
        "token_type": "bearer",
    }

@app.post("/workflow")
def create_workflow(
    payload: WorkflowPayload,
    user_email: str = Depends(get_current_user),
):
    try:
        workflow = save_workflow(
            owner_email=user_email,
            workflow_id=payload.workflowId,
            name=payload.name,
            nodes=payload.nodes,
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc))

    return {
        "id": workflow["id"],
        "name": workflow["name"],
        "nodes": workflow["nodes"],
        "message": "Workflow saved",
    }

@app.get("/workflow")
def get_workflows(user_email: str = Depends(get_current_user)):
    return list_workflows(user_email)


@app.get("/workflow/{workflow_id}")
def get_workflow_by_id(
    workflow_id: str,
    user_email: str = Depends(get_current_user),
):
    try:
        workflow = get_workflow(user_email, workflow_id)
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc))

    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return workflow


@app.post("/createNewWorkflow")
def create_new_workflow(
    payload: WorkflowGenerationPayload,
    user_email: str = Depends(get_current_user),
):
    generated_nodes = generate_workflow_nodes(payload.prompt, payload.workflowName, user_email)
    return {"nodes": generated_nodes}


@app.get("/health")
def health():
    return {"status": "ok"}

# Include your existing actions router
app.include_router(action_router)
