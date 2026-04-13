#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
src_keys="$root/validator-keys/assigned_data/keys"
src_secrets="$root/validator-keys/assigned_data/secrets"
dst="$root/data/validator"

if [[ ! -d "$src_keys" || ! -d "$src_secrets" ]]; then
  echo "Missing validator-keys output. Run scripts/02-generate-keys.sh first." >&2
  exit 1
fi

mkdir -p "$dst/validators" "$dst/secrets"
cp -rf "$src_keys/"* "$dst/validators/"
cp -rf "$src_secrets/"* "$dst/secrets/"

echo "Validator keys copied to $dst"
