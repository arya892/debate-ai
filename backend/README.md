# DebateAI – Backend

The server layer for DebateAI, powered by **Python 3.11+**, **FastAPI**, **Pydantic v2**, and **SQLAlchemy 2**.

---

## Core Capabilities
- **6-Stage Debate Pipeline:**
  1. `interpret`: Formulate formal motion and identify alternative framings.
  2. `classify`: Determine time-sensitivity for current events, prices, and laws.
  3. `research`: Query web search engines (Tavily, Brave Search, DuckDuckGo) with TTL caching.
  4. `verify`: Perform HTTP 2xx link checks and assign strict 4-tier epistemic labels:
     - `verified`: Grounded in indexed active search results.
     - `unverified`: Plausible empirical claim lacking authoritative citation.
     - `opinion`: Normative reasoning and philosophical logic.
     - `unavailable`: Data explicitly declared unavailable.
  5. `rebuttals`: Synthesize opponent counter-challenges and turnaround defenses.
  6. `prep`: Generate opening/closing speeches, CX questions, expected questions, and speaker checklists.
- **Provider-Agnostic LLM Engine:** Supports Google Gemini, OpenAI GPT-4o, Anthropic Claude, and a built-in domain reasoning engine.
- **Unified Single-Port Serving:** Mounts and serves the React frontend SPA at `/` while running API endpoints under `/api`.
- **Exports:** Generates on-the-fly PDF dossiers (using ReportLab) and Markdown exports.

---

## Running Locally

```bash
# Install dependencies
pip install -r requirements.txt

# Start FastAPI server with live reload
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

