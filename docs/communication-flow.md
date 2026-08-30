# Communication Flow

## Overview

All inter-service communication in Phase 1 uses **HTTP REST**. There is no message queue or WebSocket communication yet.

---

## Request Flow: Frontend → Backend → Database

```
┌─────────────┐   fetch()    ┌─────────────────┐   pg.Pool   ┌──────────────┐
│   Browser   │ ──────────► │  Backend (4000) │ ──────────► │ PostgreSQL   │
│  (React)    │             │  /api/v1/health  │             │   :5432      │
└─────────────┘             └─────────────────┘             └──────────────┘
      ▲                             │
      └─────────────────────────────┘
           JSON response
```

### Example: `GET /api/v1/health`

1. **Frontend** calls `fetch('http://localhost:4000/api/v1/health')`
2. **Backend** validates request, runs `SELECT 1` against PostgreSQL
3. **PostgreSQL** confirms connection, returns result
4. **Backend** returns JSON:
   ```json
   {
     "success": true,
     "data": {
       "status": "healthy",
       "service": "procureai-backend",
       "version": "1.0.0-phase1",
       "environment": "development",
       "checks": { "database": "up" }
     }
   }
   ```
5. **Frontend** renders status card

---

## Request Flow: Frontend → Backend → AI Service

```
┌─────────────┐   fetch()    ┌─────────────────┐   fetch()   ┌──────────────┐
│   Browser   │ ──────────► │  Backend (4000) │ ──────────► │ AI Service   │
│  (React)    │             │  /api/v1/ai/ping │             │    :8000     │
└─────────────┘             └─────────────────┘             │   /ping      │
      ▲                             ▲                        └──────────────┘
      │                             │                               │
      └─────────────────────────────┘ ◄─────────────────────────────┘
                JSON response (proxied)
```

### Example: `GET /api/v1/ai/ping`

1. **Frontend** calls `fetch('http://localhost:4000/api/v1/ai/ping')`
2. **Backend** calls `fetch('http://ai-service:8000/ping')` with a 5 s AbortController timeout
3. **AI Service** returns:
   ```json
   { "message": "pong", "from_service": "procureai-ai-service", "timestamp": "..." }
   ```
4. **Backend** wraps and returns:
   ```json
   {
     "success": true,
     "data": {
       "message": "Backend successfully communicated with AI service",
       "aiResponse": { "message": "pong", "from_service": "...", "timestamp": "..." }
     }
   }
   ```
5. **Frontend** shows ping result banner

---

## Aggregated System Status

The `/api/v1/status` endpoint fans out to **three parallel checks**:

```
Backend ──► checkDatabaseConnection()  ──► PostgreSQL SELECT 1
        ──► checkAiServiceHealth()     ──► AI Service /health
        ──► query health log count     ──► PostgreSQL COUNT(*)
```

All checks run concurrently; results are merged into a single response:

```json
{
  "success": true,
  "data": {
    "status": "operational",
    "timestamp": "...",
    "services": {
      "backend":   { "status": "up", "version": "1.0.0-phase1" },
      "database":  { "status": "up", "healthLogEntries": 1 },
      "aiService": { "status": "up", "url": "http://ai-service:8000", "details": {...} }
    }
  }
}
```

---

## Error Handling

| Scenario | Behaviour |
|----------|-----------|
| Database unreachable | Backend returns `503`, `status: "degraded"` |
| AI Service unreachable (timeout 5 s) | Backend returns `503`, includes `error` field |
| Invalid route | Backend returns `404 NOT_FOUND` |
| Unhandled exception | Backend returns `500 INTERNAL_ERROR` (no leak) |
| Frontend cannot reach backend | Error banner shown in UI |

---

## Docker Network

In Docker Compose all services share a default bridge network. Internal hostnames match service names:

| Service | Internal hostname |
|---------|------------------|
| PostgreSQL | `postgres` |
| Backend | `backend` |
| AI Service | `ai-service` |
| Frontend | `frontend` |

The backend's `DATABASE_URL` and `AI_SERVICE_URL` use these internal hostnames in Docker.
