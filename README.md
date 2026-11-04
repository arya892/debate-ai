# DEBATE AI – Think Both Sides

> **Production-grade full-stack web application for balanced, source-grounded, fact-verified debate intelligence.**

---

## 1. Overview & Core Promise

**DEBATE AI – Think Both Sides** enables students, debate team competitors, policy researchers, and public speakers to enter any debate topic (motion, controversial question, or policy issue) and receive:

- **Strictly Balanced Arguments**: Equal quantity (3, 5, or 7) and equal intellectual rigor for both the **AFFIRMATIVE (FOR)** and **NEGATIVE (AGAINST)** positions.
- **Audited Truth Labeling**: Every single claim, statistic, study, and quotation is evaluated through a multi-stage verification pipeline with honest epistemic labels:
  - `VERIFIED`: Directly corroborated by an active web source verified via HTTP 2xx resolution check.
  - `UNVERIFIED`: Plausible empirical assertion without verified search citation (flagged with a prominent warning).
  - `OPINION`: Normative, ethical, or deductive reasoning.
  - `DATA UNAVAILABLE`: Explicitly marked when empirical data does not exist or remains contested.
- **Rebuttal Arena**: Per-argument opponent challenges, turnaround responses, supporting evidence, and vulnerability notes.
- **Debate Preparation Dossier**: Ready-to-deliver timed speeches (sized to 2, 5, or 10 minutes at ~130 wpm), 8–10 cross-examination questions to ask, 8–10 questions to anticipate with strategic answers, and a strategy checklist.
- **Export Capabilities**: Clean, formatted PDF and Markdown dossier downloads.

---

## 2. Tech Stack

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons, Framer Motion, React Router v6.
- **Backend**: Python 3.11+, FastAPI, Pydantic v2, SQLAlchemy 2, ReportLab, HTTPX.
- **Database**: SQLite default (zero-configuration); PostgreSQL supported via `DATABASE_URL`.
- **LLM Layer**: Agnostic service supporting Anthropic (Claude 3.5 Sonnet), OpenAI (GPT-4o), Google Gemini, and a built-in fallback heuristic engine for offline/demo operation.
- **Research Engine**: Tavily API, Brave Search API, and Web fallback with brief TTL caching.

---

## 3. Project Structure

```
debate-ai/
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI application, CORS, lifecycle
│   │   ├── config.py                # Environment configuration
│   │   ├── db.py                    # SQLAlchemy 2 engine & session
│   │   ├── models.py                # Debate & Source ORM models
│   │   ├── schemas.py               # Pydantic v2 validation models
│   │   ├── routers/
│   │   │   ├── health.py            # Health probe & provider status
│   │   │   ├── history.py           # History query, pagination, delete
│   │   │   └── debates.py           # Debate generation, SSE stream, PDF/MD export
│   │   ├── services/
│   │   │   ├── llm_service.py       # Provider-agnostic LLM interface
│   │   │   ├── search_service.py    # Tavily, Brave, and web retrieval
│   │   │   ├── source_verifier.py   # HTTP 2xx link checks & evidence auditor
│   │   │   └── debate_pipeline.py   # 6-stage background orchestrator
│   │   └── prompts/                 # Modular debate prompts
│   │       ├── interpret_classify.txt
│   │       ├── arguments.txt
│   │       ├── rebuttals.txt
│   │       └── prep.txt
│   ├── tests/
│   │   └── test_api.py              # Pytest backend validation
│   ├── Dockerfile
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── api/client.ts            # API & SSE stream client
│   │   ├── components/              # Badges, modals, progress, navbar, sources
│   │   ├── hooks/                   # useLocalStorage
│   │   ├── pages/                   # Home, Results, Rebuttals, Prep, History, About
│   │   ├── types/debate.ts          # TypeScript domain interfaces
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── Dockerfile
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
├── docker-compose.yml
├── .gitignore
└── README.md
```

---

## 4. Setup & Running the Application

### Prerequisites
- Python 3.11+
- Node.js 18+ (or 20+) & npm

### Step 1: Clone & Configure Environment
Create `.env` inside `backend/`:
```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` with your API keys:
```env
DATABASE_URL=sqlite:///./debate_ai.db

# LLM Providers (Configure at least one for live AI generation)
ANTHROPIC_API_KEY=your_anthropic_api_key_here
OPENAI_API_KEY=
GEMINI_API_KEY=

# Search Providers (Optional: provides fresh web facts)
TAVILY_API_KEY=your_tavily_api_key_here
BRAVE_SEARCH_API_KEY=
```
*(Note: If no API keys are provided, DEBATE AI seamlessly falls back to its built-in structured reasoning engine, ensuring the app runs out-of-the-box without errors!)*

### Step 2: Start the Backend
From the project root:
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
Backend API will be live at `http://127.0.0.1:8000` (Docs: `http://127.0.0.1:8000/docs`).

### Step 3: Start the Frontend
In a new terminal window:
```bash
cd frontend
npm install
npm run dev
```
Frontend will be available at `http://localhost:5173`.

---

## 5. How to Obtain API Keys

- **Anthropic API (Claude)**: Visit [console.anthropic.com](https://console.anthropic.com), create an account, navigate to API Keys, and create a key.
- **OpenAI API**: Visit [platform.openai.com](https://platform.openai.com/api-keys) and generate a Secret Key.
- **Google Gemini API**: Visit [aistudio.google.com](https://aistudio.google.com/app/apikey) and generate a free API key.
- **Tavily Search API**: Visit [tavily.com](https://tavily.com) for 1,000 free research queries/month.
- **Brave Search API**: Visit [brave.com/search/api](https://brave.com/search/api/) for web search API access.

---

## 6. How Fact Verification & Grounding Works

1. **Interpretation & Classification**: The backend frames the topic neutrally and detects if it is time-sensitive (ongoing policy, fluctuating prices, current events) or enduring.
2. **Targeted Search**: Generates 4 empirical queries targeting peer-reviewed studies, government databases, and legal precedents for both sides.
3. **No Hallucinated URLs**: The LLM is constrained to only cite URLs retrieved by the search pass.
4. **Active HTTP Verification**: The backend asynchronously probes each cited URL (HTTP HEAD/GET range). Any link failing HTTP 2xx or timing out is stripped and downgraded.
5. **Epistemic Labeling**: Evidence items receive strict color-coded badges (`VERIFIED`, `UNVERIFIED`, `OPINION`, `DATA UNAVAILABLE`).
6. **Sources Drawer**: A full audit log of all retrieved articles, publishers, snippets, and resolution statuses is available on every debate.

---

## 7. Switching from SQLite to PostgreSQL

No code changes are required. Simply update `DATABASE_URL` in `backend/.env`:
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/debate_ai
```
Install the PostgreSQL driver:
```bash
pip install psycopg2-binary
```
FastAPI and SQLAlchemy will automatically create all tables on application startup.

---

## 8. Docker Deployment

To run the entire full-stack application using Docker:
```bash
docker-compose up --build
```
Access the application at `http://localhost:5173`.

---

## 9. Testing

To run the automated backend test suite:
```bash
$env:PYTHONPATH="backend"
python -m pytest backend/tests -v
```

---

## 10. Known Limitations

- **Paywalled Repositories**: Scientific journals behind paywalls cannot have their full text inspected by the automated HTTP crawler and may be flagged `unverified`.
- **Search Rate Limits**: Free-tier search accounts (Tavily/Brave) have query quotas. DEBATE AI mitigates this with an in-memory TTL query cache and automatic fallback.

