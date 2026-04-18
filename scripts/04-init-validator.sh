#!/usr/bin/env bash
# =============================================================================
#  04-init-validator.sh — Copy generated keys into the validator data directory
# =============================================================================
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC_KEYS="$ROOT/validator-keys/assigned_data/keys"
SRC_SECRETS="$ROOT/validator-keys/assigned_data/secrets"
DST="$ROOT/data/validator"

die() { echo "ERROR: $*" >&2; exit 1; }

[[ -d "$SRC_KEYS" && -d "$SRC_SECRETS" ]] || \
  die "Missing validator-keys output. Run 02-generate-keys.sh first."

mkdir -p "$DST/validators" "$DST/secrets"
cp -rf "$SRC_KEYS/"*    "$DST/validators/"
cp -rf "$SRC_SECRETS/"* "$DST/secrets/"

echo "OK  Validator keys copied to $DST"
