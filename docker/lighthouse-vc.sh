#!/bin/sh
# Lighthouse validator client startup script.
set -e

: "${CONSENSUS_HTTP_PORT:?CONSENSUS_HTTP_PORT must be set}"
: "${FEE_RECIPIENT:?FEE_RECIPIENT must be set}"

INIT_FLAG=""
if [ ! -f /validator/validators/slashing_protection.sqlite ]; then
  INIT_FLAG="--init-slashing-protection"
fi

exec lighthouse vc \
  --testnet-dir /testnet \
  --datadir /validator \
  --beacon-nodes "http://consensus:${CONSENSUS_HTTP_PORT}" \
  --suggested-fee-recipient "${FEE_RECIPIENT}" \
  ${INIT_FLAG}
