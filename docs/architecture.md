# Architecture

## Overview

ProcureAI is a monorepo for an AI-assisted government procurement platform built on the principle:

> **AI RECOMMENDS. HUMANS DECIDE. SYSTEM AUDITS.**

Phase 1 establishes the production-quality technical foundation — service scaffolding, health checks, database connectivity, and inter-service communication. Authentication and AI evaluation are deferred to later phases.

---

## Monorepo Structure

```
ProcureAI/
├── frontend/                    # React 18 + TypeScript + Tailwind CSS (Vite)
│   ├── src/
│   │   ├── api/client.ts        # Typed API client
│   │   ├── components/
│   │   │   └── StatusDashboard.tsx
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css            # Design system (dark mode, glassmorphism)
│   ├── nginx.conf               # Production nginx config
│   ├── Dockerfile               # Multi-stage: Vite build → nginx serve
│   └── tailwind.config.js
│
├── backend/                     # Node.js 20 + Express + TypeScript
│   └── src/
│       ├── config/
│       │   ├── env.ts           # Zod-validated environment
│       │   └── database.ts      # pg.Pool + helper fns
│       ├── controllers/
│       │   └── health.controller.ts
│       ├── middleware/
│       │   └── error.middleware.ts
│       ├── routes/index.ts
│       ├── services/
│       │   └── ai.service.ts    # Backend → AI HTTP client
│       ├── utils/errors.ts
│       ├── app.ts
│       └── index.ts
│
├── ai-service/                  # Python 3.12 + FastAPI
│   └── app/main.py              # Health + ping endpoints (Phase 1 skeleton)
│
├── database/                    # PostgreSQL 16
│   └── init.sql                 # Schema + seed (auto-run by postgres container)
│
├── docs/                        # Documentation
├── docker/                      # Docker Compose
│   └── docker-compose.yml       # Full-stack orchestration
├── docker-compose.yml           # Root include → docker/docker-compose.yml
└── .env.example                 # Environment variable template
```

---

## Tech Stack

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| Frontend | React + TypeScript | 18 / 5.x | User interface, real-time status dashboard |
| Frontend tooling | Vite + Tailwind CSS | 6.x / 3.x | Build tool, utility CSS |
| Backend | Node.js + Express + TypeScript | 20 / 4.x / 5.x | REST API, DB access, AI proxy |
| AI Service | Python + FastAPI | 3.12 / 0.115 | AI evaluation skeleton |
| Database | PostgreSQL | 16 | Persistent storage, audit log |
| Infrastructure | Docker Compose | v2 | Local development orchestration |
| Web server | Nginx | 1.27-alpine | Static file serving, SPA routing |

---

## Design Decisions

### 1. Monorepo
All services live in one repository for coordinated development, shared documentation, and atomic commits.

### 2. API Versioning
Backend exposes `/api/v1/*`. All new endpoints go under this prefix to allow breaking-change-free upgrades in future phases.

### 3. Health-First Architecture
Every service exposes a `/health` endpoint:
- PostgreSQL: `pg_isready` check
- Backend: `GET /api/v1/health` → checks DB connectivity
- AI Service: `GET /health` → returns service metadata
- Frontend: `GET /health` → nginx returns `200 ok`

The backend aggregates all service health at `GET /api/v1/status`.

### 4. Zod Environment Validation
The backend validates all environment variables at startup using Zod. Missing or invalid variables cause a clear error and process exit.

### 5. No Auth in Phase 1
Authentication, RBAC, and session management are deliberately deferred to Phase 2.

### 6. Separation of Schema Ownership
PostgreSQL init scripts live in `/database/`, not inside the backend. This keeps schema ownership explicit and allows schema changes independent of backend releases.

---

## Deployment Topology

```
                ┌─────────────────────────────────────────────────────┐
                │                    Docker Network                    │
                │                                                      │
  Browser ──────┤──► Frontend (nginx :80 / host :5173)                │
                │         │                                            │
                │         │ HTTP (fetch)                               │
                │         ▼                                            │
                │    Backend (Node :4000)                              │
                │         │                                            │
                │    ┌────┴─────────────────────┐                      │
                │    │                          │                      │
                │    ▼                          ▼                      │
                │  PostgreSQL (:5432)    AI Service (Python :8000)     │
                │                                                      │
                └─────────────────────────────────────────────────────┘
```

---

## Port Mapping

| Service | Host Port | Container Port | Protocol |
|---------|-----------|----------------|----------|
| Frontend | **5173** | 80 | HTTP (nginx) |
| Backend | **4000** | 4000 | HTTP (Node) |
| AI Service | **8000** | 8000 | HTTP (uvicorn) |
| PostgreSQL | **5432** | 5432 | TCP (pg wire) |

Ports can be overridden via `.env` variables: `FRONTEND_PORT`, `BACKEND_PORT`, `AI_SERVICE_PORT`, `POSTGRES_PORT`.

---

## Docker Startup Order

```
postgres (healthy) ──► ai-service (healthy) ──► backend (healthy) ──► frontend
```

Docker Compose `depends_on` + healthcheck conditions enforce this ordering.
