import pytest
import asyncio
from fastapi.testclient import TestClient
from app.main import app
from app.db import Base, engine, SessionLocal
from app.models import Debate
from app.schemas import DebateSettings
from app.services.debate_pipeline import debate_pipeline

@pytest.fixture(scope="module")
def client():
    Base.metadata.create_all(bind=engine)
    with TestClient(app) as c:
        yield c

def test_health_check(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "version" in data
    assert "llm_configured" in data
    assert "search_configured" in data

@pytest.mark.asyncio
async def test_full_pipeline_generation():
    db = SessionLocal()
    # Create test debate in DB
    debate = Debate(
        topic="Universal Basic Income should be implemented globally",
        settings=DebateSettings(
            difficulty="Intermediate",
            style="Academic",
            argument_count=3,
            duration_minutes=2,
            side_focus="Both"
        ).model_dump(),
        status="pending"
    )
    db.add(debate)
    db.commit()
    db.refresh(debate)
    debate_id = debate.id
    db.close()

    # Run pipeline
    settings = DebateSettings(
        difficulty="Intermediate",
        style="Academic",
        argument_count=3,
        duration_minutes=2,
        side_focus="Both"
    )
    await debate_pipeline.run(debate_id, debate.topic, settings, SessionLocal)

    # Verify results in DB
    db = SessionLocal()
    updated = db.query(Debate).filter(Debate.id == debate_id).first()
    assert updated is not None
    assert updated.status == "completed"
    assert updated.result is not None
    
    res = updated.result
    # Criteria 1: Equal arguments generated for both sides matching setting
    assert len(res["for_side"]["arguments"]) == 3
    assert len(res["against_side"]["arguments"]) == 3

    # Criteria 2: Verification labels exist on all evidence
    for side in ("for_side", "against_side"):
        for arg in res[side]["arguments"]:
            assert "claim" in arg
            assert "logical_explanation" in arg
            assert "real_world_example" in arg
            assert len(arg["evidence_items"]) > 0
            for ev in arg["evidence_items"]:
                assert ev["status"] in ("verified", "unverified", "opinion", "unavailable")

    # Criteria 4: Rebuttals exist for each argument
    assert len(res["for_rebuttals"]) == 3
    assert len(res["against_rebuttals"]) == 3
    for reb in res["for_rebuttals"]:
        assert "counter_challenge" in reb
        assert "logical_response" in reb
        assert "weak_point" in reb

    # Criteria 5: Speeches exist with duration
    assert res["prep_for"]["duration_minutes"] == 2
    assert len(res["prep_for"]["cross_examination_questions"]) >= 8
    assert len(res["prep_for"]["expected_questions"]) >= 8

    db.close()

def test_export_markdown_and_pdf(client):
    # Create a debate via API
    res_create = client.post("/api/debates", json={
        "topic": "Artificial intelligence in education enhances learning outcomes",
        "settings": {
            "difficulty": "Intermediate",
            "style": "Persuasive",
            "argument_count": 3,
            "duration_minutes": 2,
            "side_focus": "Both"
        }
    })
    assert res_create.status_code == 201
    debate_id = res_create.json()["id"]

    # Wait briefly or run pipeline synchronously for test
    asyncio.run(debate_pipeline.run(
        debate_id,
        "Artificial intelligence in education enhances learning outcomes",
        DebateSettings(argument_count=3, duration_minutes=2),
        SessionLocal
    ))

    # Test Markdown Export
    res_md = client.get(f"/api/debates/{debate_id}/export?format=md")
    assert res_md.status_code == 200
    assert "text/markdown" in res_md.headers["content-type"]
    assert "Debate Dossier:" in res_md.text

    # Test PDF Export
    res_pdf = client.get(f"/api/debates/{debate_id}/export?format=pdf")
    assert res_pdf.status_code == 200
    assert "application/pdf" in res_pdf.headers["content-type"]
    assert res_pdf.content.startswith(b"%PDF")

    # Test History List
    res_list = client.get("/api/debates?page=1&limit=10")
    assert res_list.status_code == 200
    assert res_list.json()["total"] >= 1

    # Test Delete
    res_del = client.delete(f"/api/debates/{debate_id}")
    assert res_del.status_code == 200
