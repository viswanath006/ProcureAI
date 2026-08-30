# Docker

Docker Compose configuration for the ProcureAI monorepo.

## Usage

From the **project root**:

```bash
docker compose up --build
```

The root `docker-compose.yml` includes `docker/docker-compose.yml`.

## Services

| Service | Image / Build | Default Host Port |
|---------|---------------|-------------------|
| postgres | postgres:16-alpine | 5432 |
| backend | ../backend/Dockerfile | 4000 |
| ai-service | ../ai-service/Dockerfile | 8000 |
| frontend | ../frontend/Dockerfile | 5173 |

See [../docs/local-development.md](../docs/local-development.md) for full instructions.
