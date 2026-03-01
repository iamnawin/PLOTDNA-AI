from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class ChatRequest(BaseModel):
    question: str
    area_slug: str | None = None


@router.post("/chat")
def chat(body: ChatRequest):
    """Ask Gemini about an area — powered by PlotDNA data."""
    return {"answer": "AI response coming soon", "sources": []}
