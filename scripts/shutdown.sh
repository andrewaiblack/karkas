#!/usr/bin/env bash
# ─── Safe shutdown ─────────────────────────────────────────────────────────────
# Stops all services gracefully without deleting data.
# Run from the project root: bash scripts/shutdown.sh
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "── Stopping Blockscout ───────────────────────────────────────────────────"
if [ -f "$ROOT/blockscout/docker-compose.yml" ]; then
  docker compose -f "$ROOT/blockscout/docker-compose.yml" \
    --env-file "$ROOT/.env" down
  echo "   Blockscout stopped."
else
  echo "   No blockscout/docker-compose.yml found, skipping."
fi

echo "── Stopping L1 stack ─────────────────────────────────────────────────────"
docker compose -f "$ROOT/docker-compose.yml" down
echo "   L1 stack stopped."

echo ""
echo "✅ All services stopped. Data is preserved in data/ and artifacts/."
echo "   Run 'bash scripts/start.sh' to bring everything back up."
