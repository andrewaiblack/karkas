#!/usr/bin/env bash
# ─── Safe start ────────────────────────────────────────────────────────────────
# Starts all services. Assumes secrets and genesis already generated.
# Run from the project root: bash scripts/start.sh
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

if [ ! -f "$ROOT/.env" ]; then
  echo "ERROR: .env not found. Run scripts/00-init-secrets.sh first."
  exit 1
fi

echo "── Starting L1 stack ─────────────────────────────────────────────────────"
docker compose -f "$ROOT/docker-compose.yml" up -d
echo "   L1 stack started."

echo "── Starting Blockscout ───────────────────────────────────────────────────"
if [ -f "$ROOT/blockscout/docker-compose.yml" ]; then
  docker compose -f "$ROOT/blockscout/docker-compose.yml" \
    --env-file "$ROOT/.env" up -d
  echo "   Blockscout started."
else
  echo "   No blockscout/docker-compose.yml found, skipping."
fi

echo ""
echo "✅ All services started."
echo "   Explorer: https://$(grep '^EXPLORER_URL' "$ROOT/network.config" | cut -d= -f2)"
echo "   RPC:      $(grep '^RPC_URL' "$ROOT/network.config" | cut -d= -f2)"
