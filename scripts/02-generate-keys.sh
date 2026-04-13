#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
values_path="$root/config/values.env"
out_dir="$root/validator-keys"

if [[ ! -f "$values_path" ]]; then
  echo "Missing $values_path" >&2
  exit 1
fi

get_env_value() {
  local key="$1"
  local line
  line="$(grep -E "^\s*export\s+$key=" "$values_path" | tail -n1 || true)"
  if [[ -z "$line" ]]; then
    echo ""
    return
  fi
  line="${line#export $key=}"
  line="${line%\"}"
  line="${line#\"}"
  echo "$line"
}

mnemonic="$(get_env_value EL_AND_CL_MNEMONIC)"
count="$(get_env_value NUMBER_OF_VALIDATORS)"

if [[ -z "$mnemonic" ]]; then
  echo "EL_AND_CL_MNEMONIC not found in values.env" >&2
  exit 1
fi
if [[ -z "$count" ]]; then
  echo "NUMBER_OF_VALIDATORS not found in values.env" >&2
  exit 1
fi

rm -rf "$out_dir"
mkdir -p "$out_dir"

echo "Generating $count validator keystores..."
docker run --rm \
  -v "$out_dir:/out" \
  --entrypoint /usr/local/bin/eth2-val-tools \
  ethpandaops/ethereum-genesis-generator:master \
  keystores \
  --source-mnemonic="$mnemonic" \
  --source-min=0 \
  --source-max="$count" \
  --out-loc /out/assigned_data \
  --insecure
