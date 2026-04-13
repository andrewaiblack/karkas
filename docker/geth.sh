#!/bin/sh
set -e

BOOTNODES_ARG=""
if [ -n "${EL_BOOTNODES:-}" ]; then
  BOOTNODES_ARG="--bootnodes=${EL_BOOTNODES}"
fi

# HTTP CORS: allow only the RPC subdomain + localhost
# Override via HTTP_CORSDOMAIN env if needed
HTTP_CORS="${HTTP_CORSDOMAIN:-https://rpc.marakyja.xyz,http://localhost:*}"
WS_ORIGINS="${WS_ORIGINS:-https://rpc.marakyja.xyz,http://localhost:*}"

exec geth \
  --datadir /data \
  --networkid "${NETWORK_ID}" \
  --http --http.addr 0.0.0.0 --http.port "${EXECUTION_HTTP_PORT}" \
  --http.api eth,net,web3,txpool \
  --http.vhosts "*" \
  --http.corsdomain "${HTTP_CORS}" \
  --ws --ws.addr 0.0.0.0 --ws.port "${EXECUTION_WS_PORT}" \
  --ws.api eth,net,web3,txpool \
  --ws.origins "${WS_ORIGINS}" \
  --authrpc.addr 127.0.0.1 --authrpc.port 8551 \
  --authrpc.vhosts "localhost,execution" \
  --authrpc.jwtsecret /jwt/jwtsecret \
  --port "${EXECUTION_P2P_PORT}" \
  --syncmode full \
  $BOOTNODES_ARG
