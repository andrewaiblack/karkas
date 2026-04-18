#!/usr/bin/env bash
# =============================================================================
#  03-init-geth.sh — Initialize the Geth data directory with the generated genesis
# =============================================================================
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
GENESIS="$ROOT/artifacts/metadata/genesis.json"
DATADIR="$ROOT/data/el"

die() { echo "ERROR: $*" >&2; exit 1; }

[[ -f "$GENESIS" ]] || die "Missing $GENESIS — run 01-generate-genesis.sh first."

mkdir -p "$DATADIR"

echo "Initializing geth datadir..."
# --user ensures geth writes chaindata as current user, not root
docker run --rm \
  --user "$(id -u):$(id -g)" \
  -v "$DATADIR:/data" \
  -v "$GENESIS:/genesis.json:ro" \
  ethereum/client-go \
  init --datadir /data /genesis.json

echo "OK  Geth initialized."
