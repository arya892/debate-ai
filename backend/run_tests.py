import sys
import asyncio
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).resolve().parent))

from app.db import Base, engine, SessionLocal
from app.models import Debate
from app.schemas import DebateSettings
from app.services.debate_pipeline import debate_pipeline
from app.routers.debates import generate_markdown, generate_pdf

def test_pipeline():
    print("Initializing database...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    topic = "Universal Basic Income should be implemented globally"
    settings = DebateSettings(
        difficulty="Intermediate",
        style="Academic",
        argument_count=3,
        duration_minutes=2,
        side_focus="Both"
    )
    debate = Debate(
        topic=topic,
        settings=settings.model_dump(),
        status="pending"
    )
    db.add(debate)
    db.commit()
    db.refresh(debate)
    debate_id = debate.id
    db.close()

    print(f"Running debate pipeline for ID: {debate_id}...")
    asyncio.run(debate_pipeline.run(debate_id, topic, settings, SessionLocal))

    db = SessionLocal()
    d = db.query(Debate).filter(Debate.id == debate_id).first()
    assert d is not None, "Debate record not found!"
    assert d.status == "completed", f"Debate failed with: {d.error_message}"
    assert d.result is not None, "Debate result is empty!"

    res = d.result
    # Criteria 1: Exactly 3 arguments for each side
    assert len(res["for_side"]["arguments"]) == 3, f"Expected 3 FOR args, got {len(res['for_side']['arguments'])}"
    assert len(res["against_side"]["arguments"]) == 3, f"Expected 3 AGAINST args, got {len(res['against_side']['arguments'])}"
    print("[PASS] Equal balanced arguments (3 FOR, 3 AGAINST)")

    # Criteria 2 & 3: Evidence status labels
    for side in ("for_side", "against_side"):
        for arg in res[side]["arguments"]:
            assert len(arg["evidence_items"]) > 0, "No evidence items"
            for ev in arg["evidence_items"]:
                assert ev["status"] in ("verified", "unverified", "opinion", "unavailable")
    print("[PASS] Evidence status labels checked (verified, unverified, opinion, unavailable)")

    # Criteria 4: Rebuttals exist for all arguments
    assert len(res["for_rebuttals"]) == 3, "Missing for_rebuttals"
    assert len(res["against_rebuttals"]) == 3, "Missing against_rebuttals"
    print("[PASS] Rebuttals generated for every argument on both sides")

    # Criteria 5: Prep speeches & word count
    prep_for = res["prep_for"]
    assert prep_for["duration_minutes"] == 2
    assert len(prep_for["cross_examination_questions"]) >= 8
    assert len(prep_for["expected_questions"]) >= 8
    print("[PASS] Prep speeches, cross-examination questions (8+), expected Q&A (8+)")

    # Criteria 8: PDF and Markdown export
    md_content = generate_markdown(topic, d.interpretation, res)
    assert "Debate Dossier:" in md_content
    assert "AFFIRMATIVE (FOR) ARGUMENTS" in md_content
    print("[PASS] Markdown export generated cleanly")

    pdf_bytes = generate_pdf(topic, d.interpretation, res)
    assert pdf_bytes.startswith(b"%PDF")
    print(f"[PASS] PDF export generated cleanly ({len(pdf_bytes)} bytes)")

    db.delete(d)
    db.commit()
    db.close()
    print("ALL BACKEND PIPELINE TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_pipeline()
