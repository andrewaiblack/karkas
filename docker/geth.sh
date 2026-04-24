#!/bin/sh
# Geth execution node startup script.
# All settings come from environment variables (sourced from .env via docker-compose).
set -e

# Validate required variables
: "${NETWORK_ID:?NETWORK_ID must be set}"
: "${EXECUTION_HTTP_PORT:?EXECUTION_HTTP_PORT must be set}"
: "${EXECUTION_WS_PORT:?EXECUTION_WS_PORT must be set}"
: "${EXECUTION_P2P_PORT:?EXECUTION_P2P_PORT must be set}"

BOOTNODES_ARG=""
if [ -n "${EL_BOOTNODES:-}" ]; then
  BOOTNODES_ARG="--bootnodes=${EL_BOOTNODES}"
fi

# Note: --http.vhosts and --http.corsdomain should be locked down in production.
# For a public testnet, '*' is acceptable.  For private use, set your domain.
exec geth \
  --datadir /data \
  --networkid "${NETWORK_ID}" \
  --http \
  --http.addr 0.0.0.0 \
  --http.port "${EXECUTION_HTTP_PORT}" \
  --http.api eth,net,web3,debug,txpool \
  --http.vhosts "*" \
  --http.corsdomain "*" \
  --ws \
  --ws.addr 0.0.0.0 \
  --ws.port "${EXECUTION_WS_PORT}" \
  --ws.api eth,net,web3,debug,txpool \
  --authrpc.addr 0.0.0.0 \
  --authrpc.port 8551 \
  --authrpc.vhosts "*" \
  --authrpc.jwtsecret /jwt/jwtsecret \
  --port "${EXECUTION_P2P_PORT}" \
  --syncmode full \
  --metrics \
  --metrics.addr 0.0.0.0 \
  --miner.gasprice "${MIN_GAS_PRICE:-1000000000}" \
  --txpool.pricelimit "${MIN_GAS_PRICE:-1000000000}" \
  --txpool.globalslots "${TXPOOL_GLOBAL_SLOTS:-4096}" \
  --txpool.accountslots "${TXPOOL_ACCOUNT_SLOTS:-16}" \
  --txpool.globalqueue "${TXPOOL_GLOBAL_QUEUE:-1024}" \
  ${BOOTNODES_ARG}
