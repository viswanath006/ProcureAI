# ─── Stage 1: Build (Vite) ───────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

ARG VITE_API_URL=http://localhost:4000/api/v1
ENV VITE_API_URL=$VITE_API_URL

COPY package*.json ./
RUN npm ci

COPY index.html ./
COPY vite.config.ts tsconfig.json tsconfig.node.json ./
COPY postcss.config.js tailwind.config.js ./
COPY public ./public
COPY src ./src

RUN npm run build

# ─── Stage 2: Serve (Nginx) ──────────────────────────────────────────────
FROM nginx:1.27-alpine AS runner

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
