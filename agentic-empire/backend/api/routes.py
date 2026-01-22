from fastapi import APIRouter, Depends
from pydantic import BaseModel
from core.auth import get_current_user
from core.llm_tier import tiered_generate
from workflows.chat import chat_workflow

router = APIRouter()

class TaskInput(BaseModel):
    prompt: str
    dept: str = "executive"

@router.get("/health")
async def health():
    return {"status": "ok"}

@router.post("/execute")
async def execute(input: TaskInput, user: str = Depends(get_current_user)):
    result = await tiered_generate(input.prompt)
    return {"result": result}

@router.post("/chat")
async def chat(input: TaskInput, user: str = Depends(get_current_user)):
    result = await chat_workflow(input.prompt, input.dept)
    # Audit (enterprise log)
    return {"response": result}

@router.post("/generate")
async def generate_text(prompt: str, user: str = Depends(get_current_user)):
    response = await tiered_generate(prompt)
    return {"response": response}