#!/usr/bin/env bash
# =============================================================================
#  02-generate-keys.sh — Generate validator keystores from mnemonic in .env
# =============================================================================
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$ROOT/.env"
OUT_DIR="$ROOT/validator-keys"

die() { echo "ERROR: $*" >&2; exit 1; }

[[ -x "$ROOT/scripts/00-init-secrets.sh" ]] && "$ROOT/scripts/00-init-secrets.sh"

# Read mnemonic and count from .env
read_env() {
  local key="$1"
  grep -E "^[[:space:]]*${key}=" "$ENV_FILE" 2>/dev/null | tail -n1 | cut -d= -f2-
}

MNEMONIC="$(read_env VALIDATOR_MNEMONIC)"
COUNT="$(read_env NUMBER_OF_VALIDATORS)"

[[ -z "$MNEMONIC" ]] && die "VALIDATOR_MNEMONIC not set. Run 00-init-secrets.sh first."
[[ -z "$COUNT" ]]    && die "NUMBER_OF_VALIDATORS not set in .env."

rm -rf "$OUT_DIR"
mkdir -p "$OUT_DIR"

echo "Generating $COUNT validator keystores..."
# --user ensures keystore files are owned by the current user, not root
docker run --rm \
  --user "$(id -u):$(id -g)" \
  -v "$OUT_DIR:/out" \
  --entrypoint /usr/local/bin/eth2-val-tools \
  ethpandaops/ethereum-genesis-generator:master \
  keystores \
  --source-mnemonic="$MNEMONIC" \
  --source-min=0 \
  --source-max="$COUNT" \
  --out-loc /out/assigned_data \
  --insecure

echo "OK  Validator keystores written to $OUT_DIR"
