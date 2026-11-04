# Deployment Guide – DebateAI

DebateAI is configured as a full-stack, unified production application. When built, the FastAPI backend automatically serves both the API endpoints and the React frontend on a single port with zero CORS configuration required.

---

## 1. Instant Local Network Deployment (Mobile & Other Devices)
Both the backend and frontend are already running and accessible across your Wi-Fi network:

- **Local Machine:** [http://localhost:5173/](http://localhost:5173/) or [http://localhost:8000/](http://localhost:8000/)
- **Phone / Tablet / Other Devices on Same Wi-Fi:** `http://10.191.82.217:5173/`

---

## 2. Deploy to the Web (Free on Render.com)

Render provides free hosting with automatic HTTPS SSL:

1. Push this project to GitHub or GitLab:
   ```bash
   git init
   git add .
   git commit -m "Deploy DebateAI"
   git branch -M main
   git remote add origin https://github.com/<your-username>/debate-ai.git
   git push -u origin main
   ```
2. Go to [render.com](https://render.com) and click **New +** &rarr; **Web Service**.
3. Select your GitHub repository.
4. Render will automatically detect the root `Dockerfile` and `render.yaml`.
5. Click **Create Web Service**. Within ~3 minutes, your live URL (e.g. `https://debate-ai.onrender.com`) will be live!

---

## 3. Deploy with Docker (Any Server / VPS / DigitalOcean)

To run the unified application locally or on any cloud VPS (Ubuntu, Debian, AWS EC2):

```bash
# Build and run with Docker Compose:
docker compose up --build -d
```

The application will be running at `http://localhost:8000` (or your server's public IP).

To stop the container:
```bash
docker compose down
```

---

## 4. Deploy to Railway.app

1. Install the Railway CLI or visit [railway.app](https://railway.app).
2. Connect your GitHub repository.
3. Railway automatically detects the root `Dockerfile` and deploys it with an instant public `.up.railway.app` domain.

---

## Environment Variables (Optional)
You can optionally configure these in your cloud provider's dashboard:

| Variable | Description | Default |
|---|---|---|
| `PORT` | Web port | `8000` |
| `DATABASE_URL` | Database connection URL | `sqlite:///./debate_ai.db` |
| `GEMINI_API_KEY` | Google Gemini API Key | *(Can also be entered in UI)* |
| `OPENAI_API_KEY` | OpenAI API Key | *(Optional)* |
| `ANTHROPIC_API_KEY`| Anthropic Claude API Key | *(Optional)* |
| `TAVILY_API_KEY` | Tavily Web Search Key | *(Optional)* |
