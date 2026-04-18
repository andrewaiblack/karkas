#!/usr/bin/env bash
# =============================================================================
#  01-generate-genesis.sh
#  Renders config templates from .env + network.config, then runs the
#  ethereum-genesis-generator docker image to produce all genesis artifacts.
#
#  FIXES APPLIED:
#  1. CHAIN_ID passed via -e to docker run (genesis generator reads env var)
#  2. chain_id: added to el/genesis-config.yaml render
#  3. Prague/Osaka stripped from genesis.json BEFORE CL genesis generation
#     so Geth 1.14.x computes the same block hash as Lighthouse
#  4. Genesis generated in two steps: el -> strip -> cl
# =============================================================================
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CFG="$ROOT/network.config"
ENV_FILE="$ROOT/.env"
TEMPLATES="$ROOT/config"
RENDERED="$ROOT/.rendered-config"
OUT_DIR="$ROOT/artifacts"

die() { echo "ERROR: $*" >&2; exit 1; }

# Run secrets init first (idempotent)
[[ -x "$ROOT/scripts/00-init-secrets.sh" ]] && "$ROOT/scripts/00-init-secrets.sh"

# ── load all variables from .env and network.config ──────────────────────────

load_env() {
  local file="$1"
  [[ -f "$file" ]] || return
  while IFS= read -r line; do
    [[ "$line" =~ ^[[:space:]]*# ]] && continue
    [[ -z "${line// }" ]] && continue
    line="${line#export }"
    [[ "$line" == *=* ]] || continue
    local key="${line%%=*}"
    local val="${line#*=}"
    val="${val%\"}"
    val="${val#\"}"
    export "$key=$val" 2>/dev/null || true
  done < "$file"
}

load_env "$CFG"
load_env "$ENV_FILE"

# Mandatory variables
[[ -z "${VALIDATOR_MNEMONIC:-}" ]] && die "VALIDATOR_MNEMONIC not set. Run 00-init-secrets.sh first."
[[ -z "${FAUCET_ADDRESS:-}" ]]     && die "FAUCET_ADDRESS not set. Run 00-init-secrets.sh first."
[[ -z "${CHAIN_ID:-}" ]]           && die "CHAIN_ID not set in network.config."

# ── render config templates ───────────────────────────────────────────────────

rm -rf "$RENDERED"
cp -r "$TEMPLATES" "$RENDERED"

# Render mnemonics.yaml
WITHDRAWAL_ADDRESS="${WITHDRAWAL_ADDRESS:-$FAUCET_ADDRESS}"
WITHDRAWAL_TYPE="${WITHDRAWAL_TYPE:-0x01}"
NUMBER_OF_VALIDATORS="${NUMBER_OF_VALIDATORS:-64}"
VALIDATOR_BALANCE="${VALIDATOR_BALANCE:-32000000000}"

cat > "$RENDERED/cl/mnemonics.yaml" << YAML
- mnemonic: "${VALIDATOR_MNEMONIC}"
  start: 0
  count: ${NUMBER_OF_VALIDATORS}
  wd_address: ${WITHDRAWAL_ADDRESS}
  wd_prefix: ${WITHDRAWAL_TYPE}
  balance: ${VALIDATOR_BALANCE}
  status: 0
YAML

# Render el/genesis-config.yaml — chain_id must be here AND in docker -e
FAUCET_PREMINE_AMOUNT="${FAUCET_PREMINE_AMOUNT:-1000000ETH}"
cat > "$RENDERED/el/genesis-config.yaml" << YAML
chain_id: ${CHAIN_ID}
el_premine_addrs:
  "${FAUCET_ADDRESS}":
    balance: "${FAUCET_PREMINE_AMOUNT}"
YAML

# Render cl/config.yaml
export PRESET_BASE="${PRESET_BASE:-mainnet}"
export TERMINAL_TOTAL_DIFFICULTY="${TERMINAL_TOTAL_DIFFICULTY:-0}"
export GENESIS_FORK_VERSION="${GENESIS_FORK_VERSION:-0x10000000}"
export GENESIS_DELAY="${GENESIS_DELAY:-60}"
export ALTAIR_FORK_VERSION="${ALTAIR_FORK_VERSION:-0x20000000}"
export ALTAIR_FORK_EPOCH="${ALTAIR_FORK_EPOCH:-0}"
export BELLATRIX_FORK_VERSION="${BELLATRIX_FORK_VERSION:-0x30000000}"
export BELLATRIX_FORK_EPOCH="${BELLATRIX_FORK_EPOCH:-0}"
export CAPELLA_FORK_VERSION="${CAPELLA_FORK_VERSION:-0x40000000}"
export CAPELLA_FORK_EPOCH="${CAPELLA_FORK_EPOCH:-0}"
export DENEB_FORK_VERSION="${DENEB_FORK_VERSION:-0x50000000}"
export DENEB_FORK_EPOCH="${DENEB_FORK_EPOCH:-0}"
export ELECTRA_FORK_VERSION="${ELECTRA_FORK_VERSION:-0x60000000}"
export ELECTRA_FORK_EPOCH="${ELECTRA_FORK_EPOCH:-18446744073709551615}"
export FULU_FORK_VERSION="${FULU_FORK_VERSION:-0x70000000}"
export FULU_FORK_EPOCH="${FULU_FORK_EPOCH:-18446744073709551615}"
export GLOAS_FORK_VERSION="${GLOAS_FORK_VERSION:-0x80000000}"
export GLOAS_FORK_EPOCH="${GLOAS_FORK_EPOCH:-18446744073709551615}"
export HEZE_FORK_VERSION="${HEZE_FORK_VERSION:-0x90000000}"
export HEZE_FORK_EPOCH="${HEZE_FORK_EPOCH:-18446744073709551615}"
export EIP7928_FORK_VERSION="${EIP7928_FORK_VERSION:-0xa0000000}"
export EIP7928_FORK_EPOCH="${EIP7928_FORK_EPOCH:-18446744073709551615}"
export SLOT_DURATION_IN_SECONDS="${SLOT_DURATION_IN_SECONDS:-12}"
export SLOT_DURATION_MS="${SLOT_DURATION_MS:-12000}"
export SECONDS_PER_ETH1_BLOCK="${SECONDS_PER_ETH1_BLOCK:-12}"
export MIN_VALIDATOR_WITHDRAWABILITY_DELAY="${MIN_VALIDATOR_WITHDRAWABILITY_DELAY:-256}"
export SHARD_COMMITTEE_PERIOD="${SHARD_COMMITTEE_PERIOD:-256}"
export ETH1_FOLLOW_DISTANCE="${ETH1_FOLLOW_DISTANCE:-16}"
export EJECTION_BALANCE="${EJECTION_BALANCE:-16000000000}"
export MIN_PER_EPOCH_CHURN_LIMIT="${MIN_PER_EPOCH_CHURN_LIMIT:-4}"
export CHURN_LIMIT_QUOTIENT="${CHURN_LIMIT_QUOTIENT:-65536}"
export MAX_PER_EPOCH_ACTIVATION_CHURN_LIMIT="${MAX_PER_EPOCH_ACTIVATION_CHURN_LIMIT:-8}"
export MIN_PER_EPOCH_CHURN_LIMIT_ELECTRA="${MIN_PER_EPOCH_CHURN_LIMIT_ELECTRA:-128000000000}"
export MAX_PER_EPOCH_ACTIVATION_EXIT_CHURN_LIMIT="${MAX_PER_EPOCH_ACTIVATION_EXIT_CHURN_LIMIT:-256000000000}"
export MAX_PAYLOAD_SIZE="${MAX_PAYLOAD_SIZE:-10485760}"
export MAX_REQUEST_BLOCKS_DENEB="${MAX_REQUEST_BLOCKS_DENEB:-128}"
export MIN_EPOCHS_FOR_BLOB_SIDECARS_REQUESTS="${MIN_EPOCHS_FOR_BLOB_SIDECARS_REQUESTS:-4096}"
export MAX_BLOBS_PER_BLOCK_ELECTRA="${MAX_BLOBS_PER_BLOCK_ELECTRA:-9}"
export SAMPLES_PER_SLOT="${SAMPLES_PER_SLOT:-8}"
export CUSTODY_REQUIREMENT="${CUSTODY_REQUIREMENT:-4}"
export MIN_EPOCHS_FOR_DATA_COLUMN_SIDECARS_REQUESTS="${MIN_EPOCHS_FOR_DATA_COLUMN_SIDECARS_REQUESTS:-4096}"
export MIN_BUILDER_WITHDRAWABILITY_DELAY="${MIN_BUILDER_WITHDRAWABILITY_DELAY:-4096}"
export ATTESTATION_DUE_BPS_GLOAS="${ATTESTATION_DUE_BPS_GLOAS:-2500}"
export AGGREGATE_DUE_BPS_GLOAS="${AGGREGATE_DUE_BPS_GLOAS:-5000}"
export SYNC_MESSAGE_DUE_BPS_GLOAS="${SYNC_MESSAGE_DUE_BPS_GLOAS:-2500}"
export CONTRIBUTION_DUE_BPS_GLOAS="${CONTRIBUTION_DUE_BPS_GLOAS:-5000}"
export PAYLOAD_ATTESTATION_DUE_BPS="${PAYLOAD_ATTESTATION_DUE_BPS:-7500}"
export VIEW_FREEZE_CUTOFF_BPS="${VIEW_FREEZE_CUTOFF_BPS:-7500}"
export INCLUSION_LIST_SUBMISSION_DUE_BPS="${INCLUSION_LIST_SUBMISSION_DUE_BPS:-6667}"
export PROPOSER_INCLUSION_LIST_CUTOFF_BPS="${PROPOSER_INCLUSION_LIST_CUTOFF_BPS:-9167}"
export DEPOSIT_CONTRACT_ADDRESS="${DEPOSIT_CONTRACT_ADDRESS:-}"
GENESIS_TIMESTAMP=$(( $(date +%s) + ${GENESIS_DELAY:-60} ))
export GENESIS_TIMESTAMP

envsubst < "$ROOT/config/cl/config.yaml" > "$RENDERED/cl/config.yaml"

# ── prepare output dirs ───────────────────────────────────────────────────────

rm -rf "$OUT_DIR"
mkdir -p "$OUT_DIR/metadata" "$OUT_DIR/jwt" "$OUT_DIR/parsed"

JWT_SECRET="$(grep '^JWT_SECRET=' "$ENV_FILE" | cut -d= -f2-)"
if [[ -n "$JWT_SECRET" ]]; then
  printf '%s' "0x${JWT_SECRET#0x}" > "$OUT_DIR/jwt/jwtsecret"
  echo "  OK JWT secret written to artifacts/jwt/jwtsecret"
else
  die "JWT_SECRET not found in .env — run 00-init-secrets.sh first."
fi

# ── run genesis generator ─────────────────────────────────────────────────────

echo "Generating genesis (GENESIS_TIMESTAMP=$GENESIS_TIMESTAMP, CHAIN_ID=$CHAIN_ID)..."

DOCKER_BASE="docker run --rm
  --user $(id -u):$(id -g)
  -v $OUT_DIR:/data
  -v $RENDERED:/config
  -e GENESIS_TIMESTAMP=$GENESIS_TIMESTAMP
  -e CHAIN_ID=$CHAIN_ID
  ethpandaops/ethereum-genesis-generator:master"

# Step 1: EL genesis (genesis.json) — will contain pragueTime/osakaTime
$DOCKER_BASE el

# Step 2: Strip Prague/Osaka BEFORE CL genesis reads genesis.json.
# Geth v1.14.x ignores unknown forks when hashing, so without this strip
# Geth and Lighthouse compute different genesis block hashes and the chain
# never starts (Forkchoice requested unknown head).
python3 - "$OUT_DIR/metadata/genesis.json" << 'PYEOF'
import json, sys
path = sys.argv[1]
with open(path) as f:
    d = json.load(f)
removed = [k for k in ['pragueTime', 'osakaTime'] if d['config'].pop(k, None) is not None]
with open(path, 'w') as f:
    json.dump(d, f, indent=2)
if removed:
    print(f"  OK Stripped {', '.join(removed)} from genesis.json")
PYEOF

# Step 3: CL genesis (genesis.ssz) — uses the stripped genesis.json
$DOCKER_BASE cl

echo ""
echo "Genesis artifacts written to $OUT_DIR"
