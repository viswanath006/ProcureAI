# Services

## Frontend

**Technology:** React 18 · TypeScript · Tailwind CSS · Vite  
**Container:** nginx:1.27-alpine  
**URL (local):** http://localhost:5173

### Purpose
Single-page application providing a real-time system status dashboard. Communicates with the backend API to display service health and connectivity status.

### Key Files
| File | Description |
|------|-------------|
| `src/App.tsx` | Root component — hero, roadmap, API reference |
| `src/components/StatusDashboard.tsx` | Live health dashboard with auto-refresh |
| `src/api/client.ts` | Typed HTTP client (no auth headers in Phase 1) |
| `src/index.css` | Design system: dark mode, glassmorphism, animations |

### Environment Variables
| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `http://localhost:4000/api/v1` | Backend API base URL |

> **Note:** In Docker, `VITE_API_URL` is baked into the bundle at build time via a Docker build arg.

---

## Backend

**Technology:** Node.js 20 · Express · TypeScript  
**Port:** 4000  
**URL (local):** http://localhost:4000

### Purpose
Central REST API. Handles:
- Health aggregation (self + database + AI service)
- Database queries (via `pg.Pool`)
- Proxy/relay of AI service health checks
- Future: business logic, auth, tender management

### Key Files
| File | Description |
|------|-------------|
| `src/index.ts` | Server bootstrap and graceful shutdown |
| `src/app.ts` | Express app configuration (CORS, Helmet, routes) |
| `src/config/env.ts` | Zod environment schema — fails fast on misconfiguration |
| `src/config/database.ts` | pg.Pool with helpers: `query()`, `withTransaction()` |
| `src/controllers/health.controller.ts` | Health/status endpoint handlers |
| `src/services/ai.service.ts` | HTTP client for AI service with 5 s timeout |
| `src/middleware/error.middleware.ts` | Centralized error handler (AppError, ZodError) |
| `src/utils/errors.ts` | Typed error classes |

### API Endpoints
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/` | Service info and endpoint listing |
| GET | `/api/v1/health` | Backend + database health |
| GET | `/api/v1/status` | Aggregated status of all services |
| GET | `/api/v1/ai/health` | AI service health (proxied, with timeout) |
| GET | `/api/v1/ai/ping` | Backend → AI ping test |

### Environment Variables
| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | ✅ | — | PostgreSQL connection string |
| `PORT` | | `4000` | Server listen port |
| `NODE_ENV` | | `development` | Runtime environment |
| `CORS_ORIGIN` | | `http://localhost:5173` | Allowed CORS origin |
| `AI_SERVICE_URL` | | `http://localhost:8000` | AI service base URL |

---

## AI Service

**Technology:** Python 3.12 · FastAPI · Uvicorn  
**Port:** 8000  
**URL (local):** http://localhost:8000

### Purpose
Phase 1 skeleton. Provides health check and ping endpoints. Future phases will add bid evaluation, scoring, and explainability APIs.

### Key Files
| File | Description |
|------|-------------|
| `app/main.py` | FastAPI app with `/`, `/health`, `/ping` |
| `requirements.txt` | pinned deps: fastapi, uvicorn, pydantic |

### Endpoints
| Method | Path | Response |
|--------|------|----------|
| GET | `/` | Service info (name, tagline, phase) |
| GET | `/health` | Status, version, capabilities list |
| GET | `/ping` | Pong response with timestamp |

### Environment Variables
| Variable | Default | Description |
|----------|---------|-------------|
| `ENVIRONMENT` | `development` | Runtime environment |
| `PORT` | `8000` | Uvicorn listen port |

---

## Database (PostgreSQL)

**Image:** postgres:16-alpine  
**Port:** 5432

### Purpose
Persistent storage. Phase 1 contains a single `service_health_log` table used to verify DB connectivity and log health events.

### Schema
```sql
CREATE TABLE service_health_log (
  id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name VARCHAR(100) NOT NULL,
  status      VARCHAR(50)   NOT NULL DEFAULT 'healthy',
  message     TEXT,
  metadata    JSONB         NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
```

### Initialization
`database/init.sql` is automatically executed on first container start via the `docker-entrypoint-initdb.d` mechanism.

### Environment Variables
| Variable | Default |
|----------|---------|
| `POSTGRES_USER` | `procureai` |
| `POSTGRES_PASSWORD` | `procureai_dev_password` |
| `POSTGRES_DB` | `procureai` |
| `POSTGRES_PORT` | `5432` |
