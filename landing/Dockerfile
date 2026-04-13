# ── Build stage ──────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
RUN npm run build

# ── Runtime stage ─────────────────────────────────────────────────────────────
FROM nginx:alpine

# FIX: hide nginx version at build time
RUN sed -i 's/server_tokens on/server_tokens off/' /etc/nginx/nginx.conf 2>/dev/null || true

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 3000

# FIX: Docker health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:3000/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
