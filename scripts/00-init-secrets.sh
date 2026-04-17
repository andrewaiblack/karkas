#!/usr/bin/env bash
# =============================================================================
#  00-init-secrets.sh
#  Generates mnemonic, faucet wallet, JWT secret, Blockscout secrets and writes
#  everything to .env (gitignored).  Safe to re-run: existing values are kept.
# =============================================================================
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CFG="$ROOT/network.config"
ENV_FILE="$ROOT/.env"

# ── helpers ──────────────────────────────────────────────────────────────────

die() { echo "ERROR: $*" >&2; exit 1; }

require_cmd() { command -v "$1" >/dev/null 2>&1 || die "$1 is required but not installed."; }

# Load a key from network.config (plain KEY=VALUE lines)
cfg() {
  local key="$1"
  local line
  line="$(grep -E "^[[:space:]]*${key}[[:space:]]*=" "$CFG" | tail -n1 || true)"
  echo "${line#*=}" | xargs
}

# Read a key from .env
read_env() {
  local key="$1"
  local line
  line="$(grep -E "^[[:space:]]*${key}=" "$ENV_FILE" 2>/dev/null | tail -n1 || true)"
  [[ -z "$line" ]] && echo "" && return
  echo "${line#*=}"
}

# Write or update KEY=VALUE in .env
upsert_env() {
  local key="$1"
  local value="$2"
  local escaped
  escaped="$(printf '%s' "$value" | sed 's/[\/&]/\\&/g')"
  if grep -qE "^[[:space:]]*${key}=" "$ENV_FILE" 2>/dev/null; then
    sed -i.bak "s|^[[:space:]]*${key}=.*|${key}=${escaped}|" "$ENV_FILE"
    rm -f "$ENV_FILE.bak"
  else
    printf '%s=%s\n' "$key" "$value" >> "$ENV_FILE"
  fi
}

# ── preflight ────────────────────────────────────────────────────────────────

require_cmd docker
[[ -f "$CFG" ]] || die "network.config not found at $ROOT/network.config"

touch "$ENV_FILE"
chmod 600 "$ENV_FILE"

# ── copy all non-secret settings from network.config into .env ───────────────

network_keys=(
  NETWORK_NAME CHAIN_ID NETWORK_ID
  CURRENCY_NAME CURRENCY_SYMBOL CURRENCY_DECIMALS
  BASE_DOMAIN RPC_URL EXPLORER_URL
  EXECUTION_HTTP_PORT EXECUTION_WS_PORT EXECUTION_P2P_PORT
  CONSENSUS_HTTP_PORT CONSENSUS_P2P_TCP CONSENSUS_P2P_UDP CONSENSUS_METRICS_PORT
  FAUCET_PORT LANDING_PORT BLOCKSCOUT_PORT
  FAUCET_AMOUNT_WEI FAUCET_RATE_LIMIT_HOURS
  DEPOSIT_CONTRACT_ADDRESS
)

for key in "${network_keys[@]}"; do
  val="$(cfg "$key")"
  [[ -n "$val" ]] && upsert_env "$key" "$val"
done

# ── generate secrets ─────────────────────────────────────────────────────────

echo "── Checking secrets ──────────────────────────────────────────────────────"

MNEMONIC="$(read_env VALIDATOR_MNEMONIC)"
FAUCET_KEY="$(read_env FAUCET_PRIVATE_KEY)"
FAUCET_ADDR="$(read_env FAUCET_ADDRESS)"
JWT_SECRET="$(read_env JWT_SECRET)"
BLOCKSCOUT_DB_PW="$(read_env BLOCKSCOUT_DB_PASSWORD)"
BLOCKSCOUT_SK="$(read_env BLOCKSCOUT_SECRET_KEY_BASE)"

needs_wallet=false
[[ -z "$MNEMONIC" || -z "$FAUCET_KEY" || -z "$FAUCET_ADDR" ]] && needs_wallet=true

if [[ "$needs_wallet" == "true" ]]; then
  echo "Generating validator mnemonic + faucet wallet via Docker..."

  wallet_output="$(docker run --rm node:20-alpine sh -c "
    set -e
    npm install --silent --no-save ethers@6 2>/dev/null
    node --input-type=module <<'NODE'
import { Wallet } from 'ethers';
const validator = Wallet.createRandom();
const faucet = Wallet.createRandom();
process.stdout.write('VALIDATOR_MNEMONIC=' + validator.mnemonic.phrase + '\n');
process.stdout.write('FAUCET_PRIVATE_KEY=' + faucet.privateKey + '\n');
process.stdout.write('FAUCET_ADDRESS=' + faucet.address.toLowerCase() + '\n');
NODE
  ")"

  MNEMONIC="$(printf '%s\n' "$wallet_output" | grep '^VALIDATOR_MNEMONIC=' | cut -d= -f2-)"
  FAUCET_KEY="$(printf '%s\n' "$wallet_output" | grep '^FAUCET_PRIVATE_KEY=' | cut -d= -f2-)"
  FAUCET_ADDR="$(printf '%s\n' "$wallet_output" | grep '^FAUCET_ADDRESS=' | cut -d= -f2-)"

  [[ -z "$MNEMONIC" ]]    && die "Failed to generate validator mnemonic"
  [[ -z "$FAUCET_KEY" ]]  && die "Failed to generate faucet private key"
  [[ -z "$FAUCET_ADDR" ]] && die "Failed to derive faucet address"

  upsert_env VALIDATOR_MNEMONIC "$MNEMONIC"
  upsert_env FAUCET_PRIVATE_KEY "$FAUCET_KEY"
  upsert_env FAUCET_ADDRESS     "$FAUCET_ADDR"
  echo "  OK Validator mnemonic generated"
  echo "  OK Faucet wallet: $FAUCET_ADDR"
else
  echo "  OK Wallet secrets already present -- skipping"
fi

# JWT secret
if [[ -z "$JWT_SECRET" ]]; then
  echo "Generating JWT secret..."
  if command -v openssl >/dev/null 2>&1; then
    JWT_SECRET="$(openssl rand -hex 32)"
  else
    JWT_SECRET="$(dd if=/dev/urandom bs=32 count=1 2>/dev/null | xxd -p | tr -d '\n')"
  fi
  upsert_env JWT_SECRET "$JWT_SECRET"
  echo "  OK JWT secret generated"
else
  echo "  OK JWT secret already present -- skipping"
fi

# Blockscout DB password
if [[ -z "$BLOCKSCOUT_DB_PW" ]]; then
  echo "Generating Blockscout DB password..."
  if command -v openssl >/dev/null 2>&1; then
    BLOCKSCOUT_DB_PW="$(openssl rand -base64 24 | tr -d '/+=' | head -c 32)"
  else
    BLOCKSCOUT_DB_PW="$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | head -c 32)"
  fi
  upsert_env BLOCKSCOUT_DB_PASSWORD "$BLOCKSCOUT_DB_PW"
  echo "  OK Blockscout DB password generated"
else
  echo "  OK Blockscout DB password already present -- skipping"
fi

# Blockscout SECRET_KEY_BASE
if [[ -z "$BLOCKSCOUT_SK" ]]; then
  echo "Generating Blockscout secret key base..."
  if command -v openssl >/dev/null 2>&1; then
    BLOCKSCOUT_SK="$(openssl rand -hex 64)"
  else
    BLOCKSCOUT_SK="$(dd if=/dev/urandom bs=64 count=1 2>/dev/null | xxd -p | tr -d '\n')"
  fi
  upsert_env BLOCKSCOUT_SECRET_KEY_BASE "$BLOCKSCOUT_SK"
  echo "  OK Blockscout secret key base generated"
else
  echo "  OK Blockscout secret key base already present -- skipping"
fi

# Fee recipient
FEE_RECIPIENT="$(read_env FEE_RECIPIENT)"
if [[ -z "$FEE_RECIPIENT" || "$FEE_RECIPIENT" == "0x0000000000000000000000000000000000000000" ]]; then
  upsert_env FEE_RECIPIENT "$FAUCET_ADDR"
  echo "  OK FEE_RECIPIENT set to faucet address"
fi

# Withdrawal address
WITHDRAWAL_ADDRESS="$(read_env WITHDRAWAL_ADDRESS)"
if [[ -z "$WITHDRAWAL_ADDRESS" ]]; then
  upsert_env WITHDRAWAL_ADDRESS "$FAUCET_ADDR"
fi

echo ""
echo "Secrets ready. Values stored in .env (never commit this file)."
echo ""
echo "   Faucet address : $FAUCET_ADDR"
echo "   Chain ID       : $(cfg CHAIN_ID)"
echo ""
