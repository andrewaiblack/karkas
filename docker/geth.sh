#!/bin/sh
set -e

BOOTNODES_ARG=""
if [ -n "${EL_BOOTNODES:-}" ]; then
  BOOTNODES_ARG="--bootnodes=${EL_BOOTNODES}"
fi

exec geth \
  --datadir /data \
  --networkid "${NETWORK_ID}" \
  --http --http.addr 0.0.0.0 --http.port "${EXECUTION_HTTP_PORT}" --http.api eth,net,web3,debug,txpool \
  --http.vhosts "*" --http.corsdomain "*" \
  --ws --ws.addr 0.0.0.0 --ws.port "${EXECUTION_WS_PORT}" --ws.api eth,net,web3,debug,txpool \
  --authrpc.addr 0.0.0.0 --authrpc.port 8551 --authrpc.vhosts "*" --authrpc.jwtsecret /jwt/jwtsecret \
  --port "${EXECUTION_P2P_PORT}" \
  --syncmode full \
  $BOOTNODES_ARG
