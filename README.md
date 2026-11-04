# DebateAI – Think Both Sides

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![React](https://img.shields.io/badge/Frontend-React_18_%2B_Vite_%2B_Tailwind-61dafb.svg)](frontend/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI_%2B_Python_3.11-009688.svg)](backend/)
[![Deploy on Vercel](https://vercel.com/button)](https://vercel.com/new)
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

> **A modern, balanced AI debate generator that researches, synthesizes, and fact-verifies both sides of any motion, question, or controversy.**

---

## 1. Overview & Core Promise

**DebateAI** empowers students, competitive debate teams, public speakers, policy researchers, and critical thinkers to explore complex topics with intellectual rigor and zero bias.

Instead of generic chatbot answers, DebateAI delivers:
1. **Symmetrical Dual Perspectives:** Exactly equal argument count (3, 5, or 7) and equal logical depth for both the **FOR (Proposition)** and **AGAINST (Opposition)** positions.
2. **4-Tier Epistemic Fact Verification:**
   - `✓ VERIFIED`: Directly supported by active web sources verified with HTTP 200 checks.
   - `⚠ UNVERIFIED`: Plausible empirical claims not yet corroborated (highlighted with an audit alert).
   - `💬 OPINION`: Normative, ethical, or philosophical reasoning (clearly separated from factual claims).
   - `❓ DATA UNAVAILABLE`: Explicitly declared when empirical data does not exist, preventing AI hallucination.
3. **Rebuttal Arena:** For every argument, view the primary opponent counter-challenge, turnaround defense, and vulnerability analysis.
4. **Debate Preparation Dossier:** Ready-to-deliver constructive speeches calculated at ~130 words per minute, cross-examination questions, and anticipated questions with suggested answers.
5. **Interactive Podium Stopwatch & Teleprompter:** Practice speeches directly in the browser with timer and font size controls.
6. **One-Click Export:** Download full dossiers as PDF or Markdown, or copy complete formatted debate text with one click.

---

## 2. Design System

- **Color Palette:** Warm ivory (`#F6F3EA`), deep cobalt blue (`#244DDB`), vibrant orange (`#FF7043`), and charcoal (`#252525`).
- **Typography:** Clean, highly readable standard sans-serif (**Inter**).
- **Layout:** Symmetrical two-column debate desks with clean borders and zero visual clutter.

---

## 3. Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite 5, TypeScript, Tailwind CSS, Lucide Icons, React Router v6 |
| **Backend** | Python 3.11+, FastAPI, Pydantic v2, SQLAlchemy 2, ReportLab (PDF), HTTPX |
| **Database** | SQLite (default zero-config) or PostgreSQL via `DATABASE_URL` |
| **AI Providers** | Agnostic LLM engine supporting Google Gemini (Free), OpenAI (GPT-4o), Anthropic (Claude), and a built-in domain reasoning engine |
| **Research** | Web search with HTTP 2xx link verification and in-memory TTL caching |
| **Deployment** | Vercel, Render, Railway, Docker, or any standard Linux VPS |

---

## 4. Quickstart (Run Locally in 2 Minutes)

### Prerequisites
- Python 3.11+
- Node.js 18+ & npm

### Step 1: Clone and install dependencies

```bash
# Clone repository
git clone https://github.com/<your-username>/debate-ai.git
cd debate-ai

# Install backend dependencies
cd backend
pip install -r requirements.txt
cd ..

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### Step 2: Run Development Servers

In Terminal 1 (Backend):
```bash
python -m uvicorn --app-dir backend app.main:app --host 127.0.0.1 --port 8000 --reload
```

In Terminal 2 (Frontend):
```bash
npm --prefix frontend run dev
```

Open [http://localhost:5173/](http://localhost:5173/) in your browser!

---

## 5. Deployment Options

### Option A: Deploy to Vercel (Fastest)

1. Open your terminal in the project folder:
   ```bash
   npx vercel
   ```
2. Follow the 30-second prompts to deploy directly to `https://your-app.vercel.app`!

*Or via the [Vercel Dashboard](https://vercel.com):*
- Connect your GitHub repository.
- Framework: **Vite**
- Root Directory: `frontend` (or root using included `vercel.json`)
- Click **Deploy**.

---

### Option B: Deploy to Render.com (Free Tier with Docker)

DebateAI includes a ready-to-use `render.yaml` and multi-stage `Dockerfile`:

1. Push your repository to GitHub.
2. Go to [render.com](https://render.com) &rarr; **New +** &rarr; **Web Service**.
3. Select your repository. Render automatically detects the `Dockerfile` and builds the unified server.
4. Click **Create Web Service**.

---

### Option C: Deploy with Docker Compose

Run the entire application in a single production container:

```bash
docker compose up --build -d
```
Your application will be live at `http://localhost:8000`.

---

### Option D: Local Wi-Fi Network Access

The application is configured to listen across your local network:
- From your phone or tablet on the same Wi-Fi, open: `http://<YOUR-LOCAL-IP>:8000/`

---

## 6. Project Structure

```
debate-ai/
├── api/
│   └── index.py                     # Vercel serverless entrypoint
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI app & unified frontend static server
│   │   ├── config.py                # App configuration & environment loader
│   │   ├── db.py                    # SQLAlchemy 2 database session
│   │   ├── models.py                # Debate & Source ORM models
│   │   ├── schemas.py               # Pydantic v2 schemas
│   │   ├── routers/                 # debates.py, health.py, history.py
│   │   ├── services/
│   │   │   ├── debate_pipeline.py   # 6-stage async pipeline
│   │   │   ├── llm_service.py       # Gemini, OpenAI, Claude & heuristic engine
│   │   │   ├── search_service.py    # Search retrieval & caching
│   │   │   └── source_verifier.py   # HTTP 2xx link verification
│   │   └── prompts/                 # Modular debate prompts
│   ├── tests/                       # Pytest test suite
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/client.ts            # Frontend API & SSE stream client
│   │   ├── components/              # Navbar, EvidenceBadge, SourcesPanel, Modals
│   │   ├── pages/                   # HomePage, Results, Rebuttals, Prep, History, About
│   │   ├── types/debate.ts          # TypeScript models
│   │   ├── App.tsx
│   │   └── index.css
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
├── Dockerfile                       # Multi-stage production Docker build
├── docker-compose.yml
├── render.yaml                      # Render Blueprint
├── vercel.json                      # Vercel configuration
├── Procfile                         # Heroku/Railway Procfile
├── DEPLOYMENT.md                    # Detailed deployment guide
├── LICENSE                          # MIT License
└── README.md
```

---

## 7. Environment Variables (Optional)

Configure in `.env` or in your hosting provider's dashboard:

| Variable | Description | Default |
|---|---|---|
| `PORT` | Server Port | `8000` |
| `DATABASE_URL` | SQLite or PostgreSQL connection string | `sqlite:///./debate_ai.db` |
| `GEMINI_API_KEY` | Google Gemini API Key | *(Can also be entered in the web UI)* |
| `OPENAI_API_KEY` | OpenAI API Key (GPT-4o) | *(Optional)* |
| `ANTHROPIC_API_KEY` | Anthropic Claude API Key | *(Optional)* |
| `TAVILY_API_KEY` | Tavily Web Search API Key | *(Optional)* |

---

## 8. License

This project is licensed under the [MIT License](LICENSE).
