# Environment Setup

## Prerequisites

| Tool | Minimum Version | Notes |
|------|-----------------|-------|
| Docker Desktop | 4.x | Must have Docker Compose v2 |
| Git | any | For cloning |
| Node.js (optional) | 20 LTS | Only for local-only development |
| Python (optional) | 3.12 | Only for local-only development |

---

## Quick Start (Docker — Recommended)

```bash
# 1. Clone and enter the project
git clone <repo-url> ProcureAI
cd ProcureAI

# 2. Create environment file
cp .env.example .env
# Edit .env only if you need to change ports or passwords

# 3. Build and start all services
docker compose up --build

# 4. Open the app
open http://localhost:5173
```

> On first run, Docker builds all images. Subsequent starts are fast.

---

## Environment Variables

All variables live in the root `.env` file (copied from `.env.example`).

### Root `.env.example`

```dotenv
# PostgreSQL
POSTGRES_USER=procureai
POSTGRES_PASSWORD=procureai_dev_password
POSTGRES_DB=procureai
POSTGRES_PORT=5432
DATABASE_URL=postgresql://procureai:procureai_dev_password@localhost:5432/procureai

# Backend
PORT=4000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
AI_SERVICE_URL=http://localhost:8000

# AI Service
ENVIRONMENT=development

# Frontend (Vite)
VITE_API_URL=http://localhost:4000/api/v1

# Docker port overrides (optional)
BACKEND_PORT=4000
AI_SERVICE_PORT=8000
FRONTEND_PORT=5173
```

> **Note:** `DATABASE_URL` and `AI_SERVICE_URL` are overridden by Docker Compose to use internal service hostnames (`postgres`, `ai-service`). The root `.env` values are for local (non-Docker) development.

---

## Port Conflicts

If a port is already in use, override it in `.env`:

```dotenv
FRONTEND_PORT=3000
BACKEND_PORT=4001
AI_SERVICE_PORT=8001
POSTGRES_PORT=5433
```

---

## Per-Service Environment Files

For local (non-Docker) development, each service has its own `.env.example`:

```bash
# Backend
cp backend/.env.example backend/.env

# Frontend
cp frontend/.env.example frontend/.env.local
```

---

## Secrets Policy (Development vs Production)

| Setting | Development | Production |
|---------|------------|------------|
| `POSTGRES_PASSWORD` | `procureai_dev_password` | Strong random secret (e.g. `openssl rand -hex 32`) |
| `NODE_ENV` | `development` | `production` |
| `.env` file | Committed? No (.gitignored) | Use secret manager |

> **Never commit `.env` files.** The `.gitignore` excludes them.
