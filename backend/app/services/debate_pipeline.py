import asyncio
import logging
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, List, Callable, Optional
from sqlalchemy.orm import Session

from app.schemas import (
    DebateSettings, DebateResult, DebateInterpretation,
    DebateSide, RebuttalItem, DebatePrep, VerificationSummary,
    SourceItem, EvidenceItem
)
from app.models import Debate, Source
from app.services.search_service import search_service
from app.services.source_verifier import source_verifier
from app.services.llm_service import llm_service

logger = logging.getLogger(__name__)

PROMPTS_DIR = Path(__file__).resolve().parent.parent / "prompts"

def load_prompt(filename: str) -> str:
    path = PROMPTS_DIR / filename
    if path.exists():
        return path.read_text(encoding="utf-8")
    return ""

# Global registry of active SSE event queues for each debate id: {debate_id: [asyncio.Queue]}
active_streams: Dict[str, List[asyncio.Queue]] = {}

def register_stream(debate_id: str) -> asyncio.Queue:
    q = asyncio.Queue()
    if debate_id not in active_streams:
        active_streams[debate_id] = []
    active_streams[debate_id].append(q)
    return q

def unregister_stream(debate_id: str, q: asyncio.Queue):
    if debate_id in active_streams:
        if q in active_streams[debate_id]:
            active_streams[debate_id].remove(q)
        if not active_streams[debate_id]:
            del active_streams[debate_id]

async def emit_progress(debate_id: str, stage: str, message: str, percent: int, partial_data: Optional[Dict[str, Any]] = None):
    if debate_id in active_streams:
        event = {
            "stage": stage,
            "message": message,
            "percent": percent,
            "partial_data": partial_data
        }
        for q in active_streams[debate_id]:
            await q.put(event)

class DebatePipeline:
    async def run(self, debate_id: str, topic: str, settings: DebateSettings, db_session_factory: Callable[[], Session]):
        print(f"[PIPELINE] Started run() for {debate_id}", flush=True)
        db: Session = db_session_factory()
        try:
            print("[PIPELINE] Querying debate...", flush=True)
            debate = db.query(Debate).filter(Debate.id == debate_id).first()
            if not debate:
                logger.error(f"Debate {debate_id} not found in database.")
                return
            print("[PIPELINE] Found debate, committing processing status...", flush=True)
            debate.status = "processing"
            debate.stage_message = "Interpreting topic and scope..."
            db.commit()
            print("[PIPELINE] Committed status.", flush=True)

            # Stage 1: Interpret & Classify
            print("[PIPELINE] Stage 1: Interpret...", flush=True)
            await emit_progress(debate_id, "interpret", "Interpreting debate topic & framing...", 15)
            interp_prompt_tmpl = load_prompt("interpret_classify.txt")
            interp_prompt = interp_prompt_tmpl.replace("{topic}", str(topic))
            
            interp_json = await llm_service.generate_json(
                prompt=interp_prompt,
                system_prompt="You are a neutral debate analyst. Output JSON only.",
                context_data={"topic": topic}
            )

            interpretation = DebateInterpretation(
                interpreted_as=interp_json.get("interpreted_as", f"Debate regarding: {topic}"),
                alternative_interpretations=interp_json.get("alternative_interpretations", []),
                is_time_sensitive=interp_json.get("is_time_sensitive", False),
                category=interp_json.get("category", "General")
            )
            debate.interpretation = interpretation.interpreted_as
            db.commit()

            # Stage 2: Research & Search Queries
            print("[PIPELINE] Stage 2: Search...", flush=True)
            await emit_progress(debate_id, "research", "Conducting web research for verified evidence...", 30)
            search_queries = interp_json.get("search_queries", [
                f"{topic} empirical evidence studies",
                f"{topic} arguments statistics"
            ])

            retrieved_sources: List[Dict[str, Any]] = []
            seen_urls = set()
            search_tasks = [search_service.search(q, max_results=3) for q in search_queries[:3]]
            search_results_list = await asyncio.gather(*search_tasks, return_exceptions=True)
            for search_res in search_results_list:
                if isinstance(search_res, list):
                    for r in search_res:
                        u = r.get("url")
                        if u and u not in seen_urls:
                            seen_urls.add(u)
                            retrieved_sources.append(r)

            # Build search context text for LLM
            search_context_text = ""
            for idx, s in enumerate(retrieved_sources, 1):
                search_context_text += f"[{idx}] Title: {s.get('title')}\nPublisher: {s.get('publisher')}\nURL: {s.get('url')}\nSnippet: {s.get('snippet')}\n\n"
            if not search_context_text:
                search_context_text = "No online search sources were retrieved. All factual assertions must be labeled 'unverified' or 'opinion'."

            # Stage 3: Generate Arguments
            print("[PIPELINE] Stage 3: Arguments...", flush=True)
            await emit_progress(debate_id, "arguments", f"Generating balanced arguments ({settings.argument_count} per side)...", 50)
            arg_prompt_tmpl = load_prompt("arguments.txt")
            arg_prompt = (
                arg_prompt_tmpl
                .replace("{topic}", str(topic))
                .replace("{interpretation}", str(interpretation.interpreted_as))
                .replace("{difficulty}", str(settings.difficulty))
                .replace("{style}", str(settings.style))
                .replace("{argument_count}", str(settings.argument_count))
                .replace("{search_context}", str(search_context_text))
            )

            args_json = await llm_service.generate_json(
                prompt=arg_prompt,
                system_prompt="You are an elite, balanced debate scholar. Output valid JSON only.",
                context_data={
                    "topic": topic,
                    "interpretation": interpretation.interpreted_as,
                    "argument_count": settings.argument_count,
                    "difficulty": settings.difficulty,
                    "style": settings.style,
                    "sources": retrieved_sources
                }
            )

            raw_for_side = args_json.get("for_side", {})
            raw_against_side = args_json.get("against_side", {})

            # Stage 4: Verify Sources & Links
            print("[PIPELINE] Stage 4: Verify...", flush=True)
            await emit_progress(debate_id, "verify", "Verifying citations, HTTP status & evidence grounding...", 65)
            
            # Audit retrieved sources
            audited_sources = await source_verifier.audit_sources(retrieved_sources)

            # Process evidence items in arguments
            for_side = DebateSide.model_validate(raw_for_side)
            against_side = DebateSide.model_validate(raw_against_side)

            # Verify evidence items in for_side
            for arg in for_side.arguments:
                arg.evidence_items = await source_verifier.verify_evidence_list(arg.evidence_items, retrieved_sources)

            # Verify evidence items in against_side
            for arg in against_side.arguments:
                arg.evidence_items = await source_verifier.verify_evidence_list(arg.evidence_items, retrieved_sources)

            # Stage 5: Rebuttal Arena
            await emit_progress(debate_id, "rebuttals", "Constructing Rebuttal Arena counter-challenges...", 80)
            for_summary = "\n".join([f"- ID {a.id}: {a.claim}" for a in for_side.arguments])
            against_summary = "\n".join([f"- ID {a.id}: {a.claim}" for a in against_side.arguments])

            reb_prompt_tmpl = load_prompt("rebuttals.txt")
            reb_prompt = (
                reb_prompt_tmpl
                .replace("{topic}", str(topic))
                .replace("{interpretation}", str(interpretation.interpreted_as))
                .replace("{difficulty}", str(settings.difficulty))
                .replace("{style}", str(settings.style))
                .replace("{for_arguments_summary}", str(for_summary))
                .replace("{against_arguments_summary}", str(against_summary))
                .replace("{search_context}", str(search_context_text))
            )

            reb_json = await llm_service.generate_json(
                prompt=reb_prompt,
                system_prompt="Championship debate coach. Produce rebuttals as valid JSON.",
                context_data={
                    "topic": topic,
                    "interpretation": interpretation.interpreted_as,
                    "argument_count": settings.argument_count,
                    "difficulty": settings.difficulty,
                    "style": settings.style,
                    "sources": retrieved_sources
                }
            )

            for_rebuttals = [RebuttalItem.model_validate(r) for r in reb_json.get("for_rebuttals", [])]
            against_rebuttals = [RebuttalItem.model_validate(r) for r in reb_json.get("against_rebuttals", [])]

            # Verify evidence inside rebuttals
            for r in for_rebuttals:
                verified_ev = await source_verifier.verify_evidence_list([r.supporting_evidence], retrieved_sources)
                if verified_ev:
                    r.supporting_evidence = verified_ev[0]

            for r in against_rebuttals:
                verified_ev = await source_verifier.verify_evidence_list([r.supporting_evidence], retrieved_sources)
                if verified_ev:
                    r.supporting_evidence = verified_ev[0]

            # Stage 6: Debate Preparation (Speeches, Q&A, Checklist)
            await emit_progress(debate_id, "prep", f"Synthesizing speeches for {settings.duration_minutes} min delivery...", 92)
            prep_prompt_tmpl = load_prompt("prep.txt")

            # Generate FOR prep
            prep_for_prompt = (
                prep_prompt_tmpl
                .replace("{topic}", str(topic))
                .replace("{interpretation}", str(interpretation.interpreted_as))
                .replace("{side}", "FOR")
                .replace("{duration_minutes}", str(settings.duration_minutes))
                .replace("{target_words}", str(settings.duration_minutes * 130))
                .replace("{difficulty}", str(settings.difficulty))
                .replace("{style}", str(settings.style))
                .replace("{arguments_summary}", str(for_summary))
            )
            prep_for_json = await llm_service.generate_json(
                prompt=prep_for_prompt,
                system_prompt="Elite speechwriter and debate coach. Output JSON only.",
                context_data={
                    "topic": topic,
                    "side": "FOR",
                    "duration_minutes": settings.duration_minutes,
                    "difficulty": settings.difficulty,
                    "style": settings.style
                }
            )
            prep_for = DebatePrep.model_validate(prep_for_json)

            # Generate AGAINST prep
            prep_against_prompt = (
                prep_prompt_tmpl
                .replace("{topic}", str(topic))
                .replace("{interpretation}", str(interpretation.interpreted_as))
                .replace("{side}", "AGAINST")
                .replace("{duration_minutes}", str(settings.duration_minutes))
                .replace("{target_words}", str(settings.duration_minutes * 130))
                .replace("{difficulty}", str(settings.difficulty))
                .replace("{style}", str(settings.style))
                .replace("{arguments_summary}", str(against_summary))
            )
            prep_against_json = await llm_service.generate_json(
                prompt=prep_against_prompt,
                system_prompt="Elite speechwriter and debate coach. Output JSON only.",
                context_data={
                    "topic": topic,
                    "side": "AGAINST",
                    "duration_minutes": settings.duration_minutes,
                    "difficulty": settings.difficulty,
                    "style": settings.style
                }
            )
            prep_against = DebatePrep.model_validate(prep_against_json)

            # Calculate Verification Summary statistics
            verified_count = 0
            unverified_count = 0
            opinion_count = 0
            unavailable_count = 0

            all_ev_items: List[EvidenceItem] = []
            for arg in for_side.arguments + against_side.arguments:
                all_ev_items.extend(arg.evidence_items)
            for r in for_rebuttals + against_rebuttals:
                if r.supporting_evidence:
                    all_ev_items.append(r.supporting_evidence)

            for ev in all_ev_items:
                if ev.status == "verified":
                    verified_count += 1
                elif ev.status == "unverified":
                    unverified_count += 1
                elif ev.status == "opinion":
                    opinion_count += 1
                elif ev.status == "unavailable":
                    unavailable_count += 1

            summary = VerificationSummary(
                verified_count=verified_count,
                unverified_count=unverified_count,
                opinion_count=opinion_count,
                unavailable_count=unavailable_count,
                retrieval_date=datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC"),
                search_engine_used=search_service.provider_name
            )

            # Assemble complete DebateResult
            result = DebateResult(
                interpretation=interpretation,
                for_side=for_side,
                against_side=against_side,
                for_rebuttals=for_rebuttals,
                against_rebuttals=against_rebuttals,
                prep_for=prep_for,
                prep_against=prep_against,
                verification_summary=summary,
                sources=audited_sources
            )

            # Save in database
            debate.status = "completed"
            debate.stage_message = "Debate generation completed successfully."
            debate.result = result.model_dump()

            # Save sources in DB table
            for src in audited_sources:
                db_source = Source(
                    debate_id=debate.id,
                    title=src.title,
                    publisher=src.publisher,
                    url=src.url,
                    published_date=src.published_date,
                    verified=src.verified,
                    status_label=src.status_label,
                    snippet=src.snippet
                )
                db.add(db_source)

            db.commit()

            # Final SSE completion emit
            await emit_progress(debate_id, "complete", "Debate generation complete!", 100, result.model_dump())

        except Exception as e:
            logger.exception(f"Pipeline failed for debate {debate_id}: {e}")
            try:
                debate = db.query(Debate).filter(Debate.id == debate_id).first()
                if debate:
                    debate.status = "failed"
                    debate.error_message = str(e)
                    debate.stage_message = f"Error: {str(e)}"
                    db.commit()
                await emit_progress(debate_id, "error", f"Generation failed: {str(e)}", 0)
            except Exception:
                pass
        finally:
            db.close()

debate_pipeline = DebatePipeline()

