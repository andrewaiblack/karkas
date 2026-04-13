#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
config_dir="$root/config"
out_dir="$root/artifacts"

if [[ -f "$root/scripts/00-init-secrets.sh" ]]; then
  bash "$root/scripts/00-init-secrets.sh"
fi

rm -rf "$out_dir"/*
mkdir -p "$out_dir/metadata" "$out_dir/jwt" "$out_dir/parsed"

genesis_timestamp=$(( $(date +%s) + 120 ))
echo "Generating genesis (GENESIS_TIMESTAMP=$genesis_timestamp)..."

docker run --rm \
  -v "$out_dir:/data" \
  -v "$config_dir:/config" \
  -e "GENESIS_TIMESTAMP=$genesis_timestamp" \
  ethpandaops/ethereum-genesis-generator:master \
  all
