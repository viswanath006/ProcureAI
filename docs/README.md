# ProcureAI Documentation

Phase 1 technical foundation for the ProcureAI government procurement platform.

## Contents

| Document | Description |
|----------|-------------|
| [Architecture](./architecture.md) | Monorepo layout, tech stack, design decisions |
| [Services](./services.md) | Frontend, backend, AI service, and database |
| [Communication Flow](./communication-flow.md) | How services talk to each other |
| [Environment Setup](./environment-setup.md) | Environment variables and configuration |
| [Local Development](./local-development.md) | Commands for running locally |

## Quick Start

```bash
# From project root
cp .env.example .env
docker compose up --build
```

Open http://localhost:5173 for the frontend dashboard.
