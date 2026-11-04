import os
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.schemas import HealthResponse
from app.config import settings
from app.db import get_db
from app.services.llm_service import llm_service
from app.services.search_service import search_service

router = APIRouter(prefix="/api", tags=["health"])

class KeysUpdateRequest(BaseModel):
    gemini_api_key: Optional[str] = None
    openai_api_key: Optional[str] = None
    anthropic_api_key: Optional[str] = None
    tavily_api_key: Optional[str] = None
    brave_search_api_key: Optional[str] = None

@router.get("/health", response_model=HealthResponse)
def get_health(db: Session = Depends(get_db)):
    db_status = "connected"
    try:
        db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"error: {str(e)}"

    return HealthResponse(
        status="ok",
        version=settings.VERSION,
        llm_configured=llm_service.is_configured,
        llm_provider=llm_service.provider_name,
        search_configured=search_service.is_configured,
        search_provider=search_service.provider_name,
        database=db_status
    )

@router.post("/settings/keys")
def update_api_keys(req: KeysUpdateRequest):
    env_path = Path(__file__).resolve().parent.parent.parent / ".env"
    
    # Read existing env or create new
    existing_lines = {}
    if env_path.exists():
        for line in env_path.read_text(encoding="utf-8").splitlines():
            if "=" in line and not line.strip().startswith("#"):
                k, v = line.split("=", 1)
                existing_lines[k.strip()] = v.strip()

    if req.gemini_api_key is not None:
        key = req.gemini_api_key.strip()
        existing_lines["GEMINI_API_KEY"] = key
        settings.GEMINI_API_KEY = key
        llm_service.gemini_key = key
        os.environ["GEMINI_API_KEY"] = key

    if req.openai_api_key is not None:
        key = req.openai_api_key.strip()
        existing_lines["OPENAI_API_KEY"] = key
        settings.OPENAI_API_KEY = key
        llm_service.openai_key = key
        os.environ["OPENAI_API_KEY"] = key

    if req.anthropic_api_key is not None:
        key = req.anthropic_api_key.strip()
        existing_lines["ANTHROPIC_API_KEY"] = key
        settings.ANTHROPIC_API_KEY = key
        llm_service.anthropic_key = key
        os.environ["ANTHROPIC_API_KEY"] = key

    if req.tavily_api_key is not None:
        key = req.tavily_api_key.strip()
        existing_lines["TAVILY_API_KEY"] = key
        settings.TAVILY_API_KEY = key
        search_service.tavily_key = key
        os.environ["TAVILY_API_KEY"] = key

    if req.brave_search_api_key is not None:
        key = req.brave_search_api_key.strip()
        existing_lines["BRAVE_SEARCH_API_KEY"] = key
        settings.BRAVE_SEARCH_API_KEY = key
        search_service.brave_key = key
        os.environ["BRAVE_SEARCH_API_KEY"] = key

    # Write back to .env
    out_lines = [f"{k}={v}" for k, v in existing_lines.items()]
    env_path.write_text("\n".join(out_lines) + "\n", encoding="utf-8")

    return {
        "message": "API keys updated successfully",
        "llm_configured": llm_service.is_configured,
        "llm_provider": llm_service.provider_name,
        "search_configured": search_service.is_configured,
        "search_provider": search_service.provider_name
    }
