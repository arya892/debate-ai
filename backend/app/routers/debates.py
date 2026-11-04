import io
import json
import asyncio
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Query
from fastapi.responses import Response, StreamingResponse
from sse_starlette.sse import EventSourceResponse
from sqlalchemy.orm import Session

from app.db import get_db, SessionLocal
from app.models import Debate
from app.schemas import (
    DebateCreateRequest, DebateRegenerateRequest, DebateResponse,
    DebateSettings, DebateResult
)
from app.services.debate_pipeline import (
    debate_pipeline, register_stream, unregister_stream
)

router = APIRouter(prefix="/api/debates", tags=["debates"])

@router.post("", response_model=DebateResponse, status_code=201)
def create_debate(
    req: DebateCreateRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    settings = req.settings or DebateSettings()
    debate = Debate(
        topic=req.topic.strip(),
        settings=settings.model_dump(),
        status="pending",
        stage_message="Queued for generation..."
    )
    db.add(debate)
    db.commit()
    db.refresh(debate)

    # Launch generation in background
    background_tasks.add_task(
        debate_pipeline.run,
        debate.id,
        debate.topic,
        settings,
        SessionLocal
    )

    return debate

@router.get("/{debate_id}", response_model=DebateResponse)
def get_debate(debate_id: str, db: Session = Depends(get_db)):
    debate = db.query(Debate).filter(Debate.id == debate_id).first()
    if not debate:
        raise HTTPException(status_code=404, detail="Debate not found")
    return debate

@router.post("/{debate_id}/regenerate", response_model=DebateResponse)
def regenerate_debate(
    debate_id: str,
    req: DebateRegenerateRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    debate = db.query(Debate).filter(Debate.id == debate_id).first()
    if not debate:
        raise HTTPException(status_code=404, detail="Debate not found")

    settings = req.settings or DebateSettings(**(debate.settings or {}))
    debate.settings = settings.model_dump()
    debate.status = "pending"
    debate.stage_message = "Regeneration queued..."
    debate.result = None
    debate.error_message = None
    db.commit()
    db.refresh(debate)

    background_tasks.add_task(
        debate_pipeline.run,
        debate.id,
        debate.topic,
        settings,
        SessionLocal
    )

    return debate

@router.get("/{debate_id}/stream")
async def stream_debate(debate_id: str, db: Session = Depends(get_db)):
    debate = db.query(Debate).filter(Debate.id == debate_id).first()
    if not debate:
        raise HTTPException(status_code=404, detail="Debate not found")

    q = register_stream(debate_id)

    async def event_generator():
        try:
            # If already finished, emit current status immediately
            if debate.status in ("completed", "failed"):
                yield {
                    "event": "message",
                    "data": json.dumps({
                        "stage": "complete" if debate.status == "completed" else "error",
                        "message": debate.stage_message or debate.status,
                        "percent": 100 if debate.status == "completed" else 0,
                        "partial_data": debate.result if debate.status == "completed" else None
                    })
                }
                return

            while True:
                try:
                    event = await asyncio.wait_for(q.get(), timeout=25.0)
                    yield {
                        "event": "message",
                        "data": json.dumps(event)
                    }
                    if event.get("stage") in ("complete", "error") or event.get("percent") == 100:
                        break
                except asyncio.TimeoutError:
                    # Keep-alive heartbeat ping
                    yield {
                        "event": "ping",
                        "data": "keep-alive"
                    }
        finally:
            unregister_stream(debate_id, q)

    return EventSourceResponse(event_generator())

@router.get("/{debate_id}/export")
def export_debate(
    debate_id: str,
    format: str = Query("md", pattern="^(md|pdf)$"),
    db: Session = Depends(get_db)
):
    debate = db.query(Debate).filter(Debate.id == debate_id).first()
    if not debate:
        raise HTTPException(status_code=404, detail="Debate not found")

    if not debate.result:
        raise HTTPException(status_code=400, detail="Debate generation is not completed yet")

    res = debate.result
    topic = debate.topic
    safe_topic = "".join(c if c.isalnum() else "_" for c in topic)[:40]

    if format == "md":
        md_content = generate_markdown(topic, debate.interpretation, res)
        return Response(
            content=md_content,
            media_type="text/markdown",
            headers={"Content-Disposition": f'attachment; filename="debate_{safe_topic}.md"'}
        )
    elif format == "pdf":
        pdf_bytes = generate_pdf(topic, debate.interpretation, res)
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="debate_{safe_topic}.pdf"'}
        )

def generate_markdown(topic: str, interpretation: Optional[str], result: dict) -> str:
    md = []
    md.append(f"# Debate Dossier: {topic}\n")
    if interpretation:
        md.append(f"**Interpretation:** {interpretation}\n")
    
    interp_data = result.get("interpretation", {})
    if interp_data.get("alternative_interpretations"):
        md.append("**Alternative Interpretations:**")
        for alt in interp_data.get("alternative_interpretations", []):
            md.append(f"- {alt}")
        md.append("")

    v_sum = result.get("verification_summary", {})
    md.append("## Fact-Verification Summary")
    md.append(f"- **Status Counts:** Verified: {v_sum.get('verified_count', 0)} | Unverified: {v_sum.get('unverified_count', 0)} | Opinion: {v_sum.get('opinion_count', 0)} | Unavailable: {v_sum.get('unavailable_count', 0)}")
    md.append(f"- **Retrieved:** {v_sum.get('retrieval_date', 'N/A')} via {v_sum.get('search_engine_used', 'N/A')}\n")

    for_side = result.get("for_side", {})
    against_side = result.get("against_side", {})

    # FOR Side
    md.append("## AFFIRMATIVE (FOR) ARGUMENTS\n")
    md.append(f"**Opening Statement:** {for_side.get('opening_statement', '')}\n")
    for arg in for_side.get("arguments", []):
        md.append(f"### {arg.get('id', '').upper()}: {arg.get('claim', '')} [{arg.get('strength_label', 'Strong')}]")
        md.append(f"**Explanation:** {arg.get('logical_explanation', '')}\n")
        md.append(f"**Real-World Case:** {arg.get('real_world_example', '')}\n")
        md.append("**Evidence Items:**")
        for ev in arg.get("evidence_items", []):
            tag = ev.get('status', 'unverified').upper()
            src = f" ({ev.get('source_title', '')} - {ev.get('url', '')})" if ev.get('url') else ""
            md.append(f"- `[{tag}]` {ev.get('claim', '')}{src}")
        md.append("")
    md.append(f"**Concluding Statement:** {for_side.get('concluding_statement', '')}\n")

    # AGAINST Side
    md.append("## NEGATIVE (AGAINST) ARGUMENTS\n")
    md.append(f"**Opening Statement:** {against_side.get('opening_statement', '')}\n")
    for arg in against_side.get("arguments", []):
        md.append(f"### {arg.get('id', '').upper()}: {arg.get('claim', '')} [{arg.get('strength_label', 'Strong')}]")
        md.append(f"**Explanation:** {arg.get('logical_explanation', '')}\n")
        md.append(f"**Real-World Case:** {arg.get('real_world_example', '')}\n")
        md.append("**Evidence Items:**")
        for ev in arg.get("evidence_items", []):
            tag = ev.get('status', 'unverified').upper()
            src = f" ({ev.get('source_title', '')} - {ev.get('url', '')})" if ev.get('url') else ""
            md.append(f"- `[{tag}]` {ev.get('claim', '')}{src}")
        md.append("")
    md.append(f"**Concluding Statement:** {against_side.get('concluding_statement', '')}\n")

    # Rebuttal Arena
    md.append("## REBUTTAL ARENA\n")
    md.append("### Defending Affirmative (FOR) Arguments")
    for r in result.get("for_rebuttals", []):
        md.append(f"**On Claim:** {r.get('original_claim')}")
        md.append(f"- **Counter-Challenge:** {r.get('counter_challenge')}")
        md.append(f"- **Turnaround Response:** {r.get('logical_response')}")
        md.append(f"- **Vulnerability Note:** {r.get('weak_point')}\n")

    md.append("### Defending Negative (AGAINST) Arguments")
    for r in result.get("against_rebuttals", []):
        md.append(f"**On Claim:** {r.get('original_claim')}")
        md.append(f"- **Counter-Challenge:** {r.get('counter_challenge')}")
        md.append(f"- **Turnaround Response:** {r.get('logical_response')}")
        md.append(f"- **Vulnerability Note:** {r.get('weak_point')}\n")

    # Debate Preparation
    prep_for = result.get("prep_for", {})
    if prep_for:
        md.append("## DEBATE PREPARATION (AFFIRMATIVE)\n")
        md.append("### Opening Speech")
        md.append(f"{prep_for.get('opening_speech')}\n")
        md.append("### Closing Speech")
        md.append(f"{prep_for.get('closing_speech')}\n")
        md.append("### Cross-Examination Questions (To Ask Opponents)")
        for q in prep_for.get("cross_examination_questions", []):
            md.append(f"- {q}")
        md.append("\n### Anticipated Questions & Answers")
        for eq in prep_for.get("expected_questions", []):
            md.append(f"**Q: {eq.get('question')}**\n> A: {eq.get('suggested_answer')}\n")

    return "\n".join(md)

def generate_pdf(topic: str, interpretation: Optional[str], result: dict) -> bytes:
    from reportlab.lib.pagesizes import letter
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib import colors

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#0f172a'),
        spaceAfter=10
    )
    h2_style = ParagraphStyle(
        'SectionHeading',
        parent=styles['Heading2'],
        fontSize=13,
        leading=16,
        textColor=colors.HexColor('#1e40af'),
        spaceBefore=12,
        spaceAfter=6
    )
    body_style = ParagraphStyle(
        'BodyDark',
        parent=styles['Normal'],
        fontSize=9.5,
        leading=13,
        textColor=colors.HexColor('#334155'),
        spaceAfter=6
    )
    meta_style = ParagraphStyle(
        'Meta',
        parent=styles['Normal'],
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor('#64748b'),
        spaceAfter=4
    )

    story = []
    story.append(Paragraph(f"<b>DEBATE AI: Think Both Sides</b>", meta_style))
    story.append(Paragraph(f"Topic: {topic}", title_style))
    if interpretation:
        story.append(Paragraph(f"<b>Interpreted As:</b> {interpretation}", body_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#cbd5e1'), spaceAfter=10))

    v_sum = result.get("verification_summary", {})
    summary_txt = f"<b>Fact Verification:</b> {v_sum.get('verified_count', 0)} Verified | {v_sum.get('unverified_count', 0)} Unverified | {v_sum.get('opinion_count', 0)} Opinion | {v_sum.get('unavailable_count', 0)} Unavailable ({v_sum.get('retrieval_date', '')})"
    story.append(Paragraph(summary_txt, meta_style))
    story.append(Spacer(1, 8))

    # FOR Section
    story.append(Paragraph("<b>AFFIRMATIVE (FOR) ARGUMENTS</b>", h2_style))
    for_side = result.get("for_side", {})
    for arg in for_side.get("arguments", []):
        story.append(Paragraph(f"<b>• {arg.get('claim', '')}</b> <i>[{arg.get('strength_label', '')}]</i>", body_style))
        story.append(Paragraph(f"Explanation: {arg.get('logical_explanation', '')}", body_style))
        story.append(Paragraph(f"Real-World Case: {arg.get('real_world_example', '')}", body_style))
        story.append(Spacer(1, 4))

    # AGAINST Section
    story.append(Spacer(1, 8))
    story.append(Paragraph("<b>NEGATIVE (AGAINST) ARGUMENTS</b>", h2_style))
    against_side = result.get("against_side", {})
    for arg in against_side.get("arguments", []):
        story.append(Paragraph(f"<b>• {arg.get('claim', '')}</b> <i>[{arg.get('strength_label', '')}]</i>", body_style))
        story.append(Paragraph(f"Explanation: {arg.get('logical_explanation', '')}", body_style))
        story.append(Paragraph(f"Real-World Case: {arg.get('real_world_example', '')}", body_style))
        story.append(Spacer(1, 4))

    # Rebuttal highlights
    story.append(Spacer(1, 8))
    story.append(Paragraph("<b>REBUTTAL ARENA HIGHLIGHTS</b>", h2_style))
    for r in (result.get("for_rebuttals", [])[:3] + result.get("against_rebuttals", [])[:3]):
        story.append(Paragraph(f"<b>Challenge:</b> {r.get('counter_challenge')}", body_style))
        story.append(Paragraph(f"<b>Response:</b> {r.get('logical_response')}", body_style))
        story.append(Paragraph(f"<i>Vulnerability: {r.get('weak_point')}</i>", meta_style))
        story.append(Spacer(1, 4))

    # Speech excerpts
    prep = result.get("prep_for", {})
    if prep and prep.get("opening_speech"):
        story.append(Spacer(1, 8))
        story.append(Paragraph("<b>AFFIRMATIVE OPENING SPEECH</b>", h2_style))
        story.append(Paragraph(prep.get("opening_speech", "")[:600] + "...", body_style))

    doc.build(story)
    return buffer.getvalue()

