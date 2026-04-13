#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
genesis="$root/artifacts/metadata/genesis.json"
datadir="$root/data/el"

if [[ ! -f "$genesis" ]]; then
  echo "Missing $genesis. Run scripts/01-generate-genesis.sh first." >&2
  exit 1
fi

mkdir -p "$datadir"

echo "Initializing geth datadir..."
docker run --rm \
  -v "$datadir:/data" \
  -v "$genesis:/genesis.json" \
  ethereum/client-go \
  init --datadir /data /genesis.json
