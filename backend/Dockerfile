# ─── Stage 1: Build ──────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src

RUN npm run build

# ─── Stage 2: Production ─────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

# wget is used by the Docker healthcheck
RUN apk add --no-cache wget

# Copy package files and install production-only deps
COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled output from builder
COPY --from=builder /app/dist ./dist

EXPOSE 4000

ENV NODE_ENV=production

CMD ["node", "dist/index.js"]
