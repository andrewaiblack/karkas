#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
values="$root/config/values.env"
env_local="$root/.env.local"
env_local_example="$root/.env.local.example"

if [[ ! -f "$values" ]]; then
  echo "Missing $values" >&2
  exit 1
fi

if [[ ! -f "$env_local" ]]; then
  if [[ -f "$env_local_example" ]]; then
    cp "$env_local_example" "$env_local"
  else
    touch "$env_local"
  fi
fi

trim_quotes() {
  local v="$1"
  v="${v#\"}"; v="${v%\"}"
  v="${v#\'}"; v="${v%\'}"
  echo "$v"
}

get_export() {
  local key="$1"
  local line
  line="$(grep -E "^\s*export\s+$key=" "$values" | tail -n1 || true)"
  if [[ -z "$line" ]]; then
    echo ""
    return
  fi
  line="${line#export $key=}"
  line="$(trim_quotes "$line")"
  echo "$line"
}

set_export() {
  local key="$1"
  local value="$2"
  local quote="${3:-double}"
  local line
  case "$quote" in
    none) line="export $key=$value" ;;
    single) line="export $key='$value'" ;;
    *) line="export $key=\"$value\"" ;;
  esac

  if grep -qE "^\s*export\s+$key=" "$values"; then
    awk -v key="$key" -v line="$line" '
      BEGIN { re="^\\s*export[[:space:]]+" key "="; done=0 }
      {
        if ($0 ~ re) {
          if (!done) { print line; done=1 }
          next
        }
        print
      }
      END { if (!done) print line }
    ' "$values" > "$values.tmp" && mv "$values.tmp" "$values"
  else
    printf "\n%s\n" "$line" >> "$values"
  fi
}

get_env_local() {
  local key="$1"
  local line
  line="$(grep -E "^\s*$key=" "$env_local" | tail -n1 || true)"
  if [[ -z "$line" ]]; then
    echo ""
    return
  fi
  line="${line#*=}"
  line="$(trim_quotes "$line")"
  echo "$line"
}

set_env_local() {
  local key="$1"
  local value="$2"
  local line="$key=$value"
  if grep -qE "^\s*$key=" "$env_local"; then
    awk -v key="$key" -v line="$line" '
      BEGIN { re="^\\s*" key "="; done=0 }
      {
        if ($0 ~ re) {
          if (!done) { print line; done=1 }
          next
        }
        print
      }
      END { if (!done) print line }
    ' "$env_local" > "$env_local.tmp" && mv "$env_local.tmp" "$env_local"
  else
    printf "\n%s\n" "$line" >> "$env_local"
  fi
}

is_valid_pk() {
  [[ "$1" =~ ^0x[0-9a-fA-F]{64}$ ]]
}

normalize_pk() {
  local pk
  pk="$(trim_quotes "$1")"
  if [[ -z "$pk" ]]; then
    echo ""
    return
  fi
  if [[ "$pk" != 0x* ]]; then
    pk="0x$pk"
  fi
  echo "$pk"
}

word_count() {
  local v="$1"
  echo "$v" | awk '{print NF}'
}

is_valid_mnemonic() {
  local v="$1"
  [[ "$(word_count "$v")" -eq 24 ]]
}

run_wallet_tool() {
  local pk="$1"
  local mnemonic="$2"
  docker run --rm \
    -e PK="$pk" \
    -e MNEMONIC="$mnemonic" \
    node:20-alpine \
    sh -lc '
      set -e
      npm init -y >/dev/null 2>&1
      npm install ethers@6.11.1 --no-audit --no-fund >/dev/null 2>&1
      node --input-type=module -e "
        import { Wallet, Mnemonic } from \"ethers\";
        import { randomBytes } from \"crypto\";
        const pk = process.env.PK || \"\";
        const mnemonic = process.env.MNEMONIC || \"\";
        const wallet = pk ? new Wallet(pk) : Wallet.createRandom();
        const phrase = mnemonic && mnemonic.trim().length ? mnemonic : Mnemonic.entropyToPhrase(randomBytes(32));
        console.log(\"PK=\" + wallet.privateKey);
        console.log(\"ADDR=\" + wallet.address);
        console.log(\"MNEMONIC=\" + phrase);
      "
    '
}

pk="$(get_env_local FAUCET_PRIVATE_KEY)"
pk="$(normalize_pk "$pk")"
mnemonic="$(get_export EL_AND_CL_MNEMONIC)"
premine_addrs="$(get_export EL_PREMINE_ADDRS)"

if [[ "$pk" == "0xYOUR_FAUCET_WALLET_PRIVATE_KEY" || "$pk" == "YOUR_FAUCET_WALLET_PRIVATE_KEY" ]]; then
  pk=""
fi

needs_pk=false
needs_mnemonic=false
needs_premine=false

if [[ -z "$pk" ]] || ! is_valid_pk "$pk"; then
  needs_pk=true
fi
if [[ -z "$mnemonic" ]] || ! is_valid_mnemonic "$mnemonic"; then
  needs_mnemonic=true
fi
if [[ -z "$premine_addrs" ]]; then
  needs_premine=true
fi

if [[ "$needs_pk" == true || "$needs_mnemonic" == true || "$needs_premine" == true ]]; then
  output="$(run_wallet_tool "$pk" "$mnemonic")"
  if [[ -z "$output" ]]; then
    echo "Failed to generate secrets. Check Docker access and placeholder values in .env.local.example." >&2
    exit 1
  fi
  new_pk="$(echo "$output" | sed -n 's/^PK=//p' | head -n1)"
  new_addr="$(echo "$output" | sed -n 's/^ADDR=//p' | head -n1)"
  new_mnemonic="$(echo "$output" | sed -n 's/^MNEMONIC=//p' | head -n1)"

  if [[ "$needs_pk" == true ]]; then
    pk="$new_pk"
    set_env_local FAUCET_PRIVATE_KEY "$pk"
  fi

  if [[ "$needs_mnemonic" == true ]]; then
    mnemonic="$new_mnemonic"
    set_export EL_AND_CL_MNEMONIC "$mnemonic" double
  fi

  if [[ -n "$new_addr" ]] && [[ "$needs_premine" == true || "$needs_pk" == true ]]; then
    set_export EL_PREMINE_COUNT "0" none
    set_export EL_PREMINE_ADDRS "{\"$new_addr\":{\"balance\":\"1000000000ETH\"}}" single
  fi
fi

if [[ -z "$(get_env_local FAUCET_PRIVATE_KEY)" ]]; then
  echo "FAUCET_PRIVATE_KEY is still empty. Fill it in $env_local" >&2
  exit 1
fi
