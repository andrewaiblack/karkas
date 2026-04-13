#!/bin/sh
set -e

BOOTSTRAP_ARG=""
if [ -n "${CL_BOOTSTRAP_NODES:-}" ]; then
  BOOTSTRAP_ARG="--bootstrap-nodes=${CL_BOOTSTRAP_NODES}"
fi

exec lighthouse bn \
  --testnet-dir /testnet \
  --datadir /data \
  --execution-endpoint http://execution:8551 \
  --execution-jwt /jwt/jwtsecret \
  --http --http-address 0.0.0.0 --http-port "${CONSENSUS_HTTP_PORT}" \
  --port "${CONSENSUS_P2P_TCP}" --discovery-port "${CONSENSUS_P2P_UDP}" \
  --metrics --metrics-address 0.0.0.0 --metrics-port "${CONSENSUS_METRICS_PORT}" \
  $BOOTSTRAP_ARG
