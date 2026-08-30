# Local Development

## Docker Compose (Full Stack)

The primary development workflow. All services run in containers.

```bash
# Start everything (build if needed)
docker compose up --build

# Start in detached mode
docker compose up -d --build

# Stop all services
docker compose down

# Stop and delete volumes (wipes PostgreSQL data)
docker compose down -v

# Rebuild a single service
docker compose build backend
docker compose up -d backend

# View logs
docker compose logs -f              # all services
docker compose logs -f backend      # backend only
docker compose logs -f ai-service   # ai-service only
docker compose logs -f postgres     # postgres only
```

---

## Service URLs

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:4000/api/v1 |
| Backend Health | http://localhost:4000/api/v1/health |
| System Status | http://localhost:4000/api/v1/status |
| AI Service | http://localhost:8000 |
| AI Health | http://localhost:8000/health |
| AI Docs (Swagger) | http://localhost:8000/docs |

---

## Local Development (Without Docker)

Run each service individually for faster iteration.

### Prerequisites
- Node.js 20 LTS
- Python 3.12
- PostgreSQL running locally (or keep the Docker postgres container)

### 1. Start PostgreSQL (Docker only, optional)

```bash
docker compose up -d postgres
```

### 2. Backend

```bash
cd backend
cp .env.example .env         # create local .env
npm install
npm run dev                  # tsx watch — hot reload
```

The backend starts at **http://localhost:4000**.

### 3. AI Service

```bash
cd ai-service
python -m venv .venv

# macOS / Linux
source .venv/bin/activate

# Windows PowerShell
.\.venv\Scripts\Activate.ps1

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

The AI service starts at **http://localhost:8000**.  
Swagger docs: **http://localhost:8000/docs**.

### 4. Frontend

```bash
cd frontend
cp .env.example .env.local   # sets VITE_API_URL
npm install
npm run dev                  # Vite dev server with HMR
```

The frontend starts at **http://localhost:5173**.

---

## Useful Commands

### Backend

```bash
# Type check
cd backend && npx tsc --noEmit

# Build production bundle
cd backend && npm run build

# Lint
cd backend && npm run lint
```

### Frontend

```bash
# Type check + build
cd frontend && npm run build

# Preview production build
cd frontend && npm run preview

# Lint
cd frontend && npm run lint
```

### AI Service

```bash
# Run with auto-reload
uvicorn app.main:app --reload

# Check types
cd ai-service && python -m mypy app/
```

### Database

```bash
# Connect to PostgreSQL in Docker
docker exec -it procureai-postgres psql -U procureai -d procureai

# View health log
SELECT * FROM service_health_log ORDER BY created_at DESC;

# Reset database (deletes all data)
docker compose down -v && docker compose up -d postgres
```

---

## Test Instructions

### API Tests (curl)

```bash
# Backend info
curl http://localhost:4000/api/v1/

# Backend health (includes DB check)
curl http://localhost:4000/api/v1/health | jq

# Full system status
curl http://localhost:4000/api/v1/status | jq

# AI service health (proxied through backend)
curl http://localhost:4000/api/v1/ai/health | jq

# Backend → AI ping test
curl http://localhost:4000/api/v1/ai/ping | jq

# AI service directly
curl http://localhost:8000/health | jq
curl http://localhost:8000/ping | jq
```

### Expected Responses

**`GET /api/v1/status` — all healthy:**
```json
{
  "success": true,
  "data": {
    "status": "operational",
    "services": {
      "backend":   { "status": "up", "version": "1.0.0-phase1" },
      "database":  { "status": "up", "healthLogEntries": 1 },
      "aiService": { "status": "up", "url": "..." }
    }
  }
}
```

### UI Tests

1. Open **http://localhost:5173**
2. Verify the status dashboard shows all four service cards as **up**
3. Click **Refresh** — cards should update (15 s auto-refresh also active)
4. Click **Test Backend → AI** — a green banner should confirm the round-trip ping
5. Expand **Raw API response** to inspect the full JSON payload

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `docker compose up` fails on postgres | Another PostgreSQL is on :5432. Set `POSTGRES_PORT=5433` in `.env` |
| Backend container restarts | Check `DATABASE_URL` in `.env`. Ensure postgres is healthy first |
| Frontend shows "Could not reach backend" | Backend is still starting. Wait ~20 s and click Refresh |
| AI service not reachable | Check `docker compose logs ai-service` for Python errors |
| Port already in use | Override ports in `.env` (see environment-setup.md) |
