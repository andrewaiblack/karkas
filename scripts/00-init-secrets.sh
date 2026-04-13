#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
env_path="$root/.env"
env_local_path="$root/.env.local"
values_path="$root/config/values.env"
genesis_config="$root/config/el/genesis-config.yaml"

default_mnemonic="sleep moment list remain like wall lake industry canvas wonder ecology elite duck salad naive syrup frame brass utility club odor country obey pudding"

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is required to generate secrets. Please install docker first." >&2
  exit 1
fi

touch "$env_path"
touch "$env_local_path"
touch "$values_path"

escape_sed() {
  printf '%s' "$1" | sed -e 's/[\\/&|]/\\&/g'
}

read_env_value() {
  local file="$1"
  local key="$2"
  local line
  line="$(grep -E "^[[:space:]]*${key}=" "$file" | tail -n1 || true)"
  if [[ -z "$line" ]]; then
    echo ""
    return
  fi
  echo "${line#${key}=}"
}

read_export_value() {
  local file="$1"
  local key="$2"
  local line
  line="$(grep -E "^[[:space:]]*export[[:space:]]+${key}=" "$file" | tail -n1 || true)"
  if [[ -z "$line" ]]; then
    echo ""
    return
  fi
  line="${line#export ${key}=}"
  line="${line#\"}"
  line="${line%\"}"
  echo "$line"
}

upsert_env() {
  local file="$1"
  local key="$2"
  local value="$3"
  local escaped
  escaped="$(escape_sed "$value")"
  if grep -qE "^[[:space:]]*${key}=" "$file"; then
    sed -i.bak "s|^[[:space:]]*${key}=.*|${key}=${escaped}|" "$file"
  else
    printf '%s=%s\n' "$key" "$value" >> "$file"
  fi
  rm -f "$file.bak"
}

upsert_export() {
  local file="$1"
  local key="$2"
  local value="$3"
  local escaped
  escaped="$(printf '%s' "$value" | sed -e 's/\\/\\\\/g' -e 's/"/\\"/g')"
  if grep -qE "^[[:space:]]*export[[:space:]]+${key}=" "$file"; then
    sed -i.bak "s|^[[:space:]]*export[[:space:]]+${key}=.*|export ${key}=\"${escaped}\"|" "$file"
  else
    printf 'export %s="%s"\n' "$key" "$escaped" >> "$file"
  fi
  rm -f "$file.bak"
}

generate_secrets() {
  docker run --rm -e "FAUCET_KEY=${key}" node:20-alpine sh -lc "npm -s init -y >/dev/null && npm -s i ethers@6 >/dev/null && node - <<'NODE'
import { Wallet } from 'ethers';
const validator = Wallet.createRandom();
const faucet = Wallet.createRandom();
console.log(\`VALIDATOR_MNEMONIC=\${validator.mnemonic.phrase}\`);
console.log(\`FAUCET_PRIVATE_KEY=\${faucet.privateKey}\`);
console.log(\`FAUCET_ADDRESS=\${faucet.address.toLowerCase()}\`);
NODE"
}

derive_address() {
  local key="$1"
  docker run --rm node:20-alpine sh -lc "npm -s init -y >/dev/null && npm -s i ethers@6 >/dev/null && node - <<'NODE'
import { Wallet } from 'ethers';
const key = process.env.FAUCET_KEY;
const wallet = new Wallet(key);
console.log(wallet.address.toLowerCase());
NODE"
}

needs_mnemonic=false
needs_faucet_key=false

current_mnemonic="$(read_export_value "$values_path" "EL_AND_CL_MNEMONIC")"
if [[ -z "$current_mnemonic" || "$current_mnemonic" == "$default_mnemonic" ]]; then
  needs_mnemonic=true
fi

current_faucet_key="$(read_env_value "$env_path" "FAUCET_PRIVATE_KEY")"
if [[ -z "$current_faucet_key" ]]; then
  current_faucet_key="$(read_env_value "$env_local_path" "FAUCET_PRIVATE_KEY")"
fi
if [[ -z "$current_faucet_key" ]]; then
  needs_faucet_key=true
fi

validator_mnemonic="$current_mnemonic"
faucet_private_key="$current_faucet_key"
faucet_address="$(read_env_value "$env_path" "FAUCET_ADDRESS")"

if [[ "$needs_mnemonic" == "true" || "$needs_faucet_key" == "true" ]]; then
  echo "Generating secrets with docker..."
  secrets="$(generate_secrets)"
  if [[ "$needs_mnemonic" == "true" ]]; then
    validator_mnemonic="$(printf '%s\n' "$secrets" | sed -n 's/^VALIDATOR_MNEMONIC=//p')"
  fi
  if [[ "$needs_faucet_key" == "true" ]]; then
    faucet_private_key="$(printf '%s\n' "$secrets" | sed -n 's/^FAUCET_PRIVATE_KEY=//p')"
    faucet_address="$(printf '%s\n' "$secrets" | sed -n 's/^FAUCET_ADDRESS=//p')"
  fi
fi

if [[ -z "$faucet_address" && -n "$faucet_private_key" ]]; then
  echo "Deriving faucet address from existing private key..."
  faucet_address="$(derive_address "$faucet_private_key")"
fi

if [[ -n "$validator_mnemonic" ]]; then
  upsert_export "$values_path" "EL_AND_CL_MNEMONIC" "$validator_mnemonic"
fi

if [[ -n "$faucet_private_key" ]]; then
  upsert_env "$env_path" "FAUCET_PRIVATE_KEY" "$faucet_private_key"
  upsert_env "$env_local_path" "FAUCET_PRIVATE_KEY" "$faucet_private_key"
fi

if [[ -n "$faucet_address" ]]; then
  upsert_env "$env_path" "FAUCET_ADDRESS" "$faucet_address"
  upsert_export "$values_path" "WITHDRAWAL_ADDRESS" "$faucet_address"
fi

fee_recipient="$(read_env_value "$env_path" "FEE_RECIPIENT")"
if [[ -n "$faucet_address" && ( -z "$fee_recipient" || "$fee_recipient" == "0x0000000000000000000000000000000000000000" ) ]]; then
  upsert_env "$env_path" "FEE_RECIPIENT" "$faucet_address"
fi

if [[ -n "$faucet_address" && -f "$genesis_config" ]]; then
  if grep -q "0xYOUR_FAUCET_ADDRESS" "$genesis_config"; then
    sed -i.bak "s/0xYOUR_FAUCET_ADDRESS/$(escape_sed "$faucet_address")/" "$genesis_config"
    rm -f "$genesis_config.bak"
  elif grep -q "0x0000000000000000000000000000000000000000" "$genesis_config"; then
    sed -i.bak "s/0x0000000000000000000000000000000000000000/$(escape_sed "$faucet_address")/" "$genesis_config"
    rm -f "$genesis_config.bak"
  fi
fi

echo "Secrets ready."
