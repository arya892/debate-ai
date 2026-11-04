from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.db import get_db
from app.models import Debate
from app.schemas import DebateListResponse, DebateSummary

router = APIRouter(prefix="/api/debates", tags=["debates"])

@router.get("", response_model=DebateListResponse)
def list_debates(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=50),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Debate)
    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(Debate.topic.ilike(term))

    total = query.count()
    offset = (page - 1) * limit
    debates = query.order_by(desc(Debate.created_at)).offset(offset).limit(limit).all()

    items = []
    for d in debates:
        arg_cnt = 5
        if d.settings and isinstance(d.settings, dict):
            arg_cnt = d.settings.get("argument_count", 5)
        items.append(DebateSummary(
            id=d.id,
            topic=d.topic,
            interpretation=d.interpretation,
            status=d.status,
            settings=d.settings or {},
            created_at=d.created_at,
            argument_count=arg_cnt
        ))

    return DebateListResponse(
        items=items,
        total=total,
        page=page,
        limit=limit
    )

@router.delete("/{debate_id}")
def delete_debate(debate_id: str, db: Session = Depends(get_db)):
    debate = db.query(Debate).filter(Debate.id == debate_id).first()
    if not debate:
        raise HTTPException(status_code=404, detail="Debate not found")
    
    db.delete(debate)
    db.commit()
    return {"message": "Debate deleted successfully", "id": debate_id}

