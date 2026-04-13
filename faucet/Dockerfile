# ── Build stage ──────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
RUN npm run build

# ── Runtime stage ─────────────────────────────────────────────────────────────
FROM node:20-alpine
WORKDIR /app

# FIX: create non-root user — container must NOT run as root
RUN addgroup -S faucet && adduser -S faucet -G faucet

COPY package.json ./
RUN npm install --omit=dev

COPY server.js ./
COPY --from=builder /app/dist ./dist

# Hand ownership to the non-root user before switching
RUN chown -R faucet:faucet /app

USER faucet

EXPOSE 5000

# FIX: Docker health check — lets orchestrators detect a hung process
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:5000/healthz || exit 1

CMD ["node", "server.js"]
