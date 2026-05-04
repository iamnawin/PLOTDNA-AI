from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.core.auth import require_user_id
from app.services.entitlements_store import consume_search

router = APIRouter()


class ChatRequest(BaseModel):
    question: str
    area_slug: str | None = None


@router.post("/chat")
def chat(body: ChatRequest, user_id: str = Depends(require_user_id)):
    """Ask Gemini about an area — powered by PlotDNA data."""
    ent = consume_search(user_id)
    if not ent.subscription_active and ent.free_remaining <= 0:
        raise HTTPException(status_code=402, detail="Subscription required")
    return {"answer": "AI response coming soon", "sources": []}
