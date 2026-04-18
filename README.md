# PoS EVM L1 Testnet (Geth + Lighthouse)

Full Proof-of-Stake EVM testnet — Execution Layer = Geth, Consensus/Validator = Lighthouse.

## Quick Start

### 1. Edit `network.config`

Open `network.config` and adjust the settings you need:

```
NETWORK_NAME=karkas        # name shown in Blockscout / config
CHAIN_ID=144411            # EVM chain ID (pick something unique)
CURRENCY_SYMBOL=KRKS       # token symbol
BASE_DOMAIN=localhost      # your domain (or localhost for local use)
RPC_URL=http://localhost:8545
EXPLORER_URL=http://localhost:4000

# Ports
EXECUTION_HTTP_PORT=8545
EXECUTION_WS_PORT=8546
FAUCET_PORT=5000
...
```

That file is the **only** place you configure the network. Everything else reads from it.

### 2. Generate all secrets

```bash
bash scripts/00-init-secrets.sh
```

This generates and saves to `.env` (gitignored):
- Validator BIP-39 mnemonic
- Faucet private key + Ethereum address
- JWT secret (for EL ↔ CL authentication)
- Blockscout DB password + secret key base

Safe to re-run — existing values are never overwritten.

### 3. Generate genesis

```bash
bash scripts/01-generate-genesis.sh
```

Renders config templates with your values, then runs `ethereum-genesis-generator` to produce all artifacts in `artifacts/`.

### 4. Generate validator keys

```bash
bash scripts/02-generate-keys.sh
```

### 5. Initialise Geth

```bash
bash scripts/03-init-geth.sh
```

### 6. Copy validator keys

```bash
bash scripts/04-init-validator.sh
```

### 7. Start the stack

```bash
docker compose up -d
```

### 8. Start Blockscout (optional)

```bash
cd blockscout
docker compose --env-file ../.env up -d
```

---

## Architecture

```
network.config          ← single source of truth for all settings
  ↓
00-init-secrets.sh      ← generates secrets, writes .env
  ↓
.env                    ← all config + secrets (gitignored)
  ↓
docker-compose.yml      ← reads .env only, no hardcoding
blockscout/docker-compose.yml ← reads root .env via --env-file
```

## Adding More Validators

1. Edit `NUMBER_OF_VALIDATORS` in `network.config`.
2. Re-run secrets (idempotent), re-generate genesis, re-generate keys, restart.

## Multi-Machine Setup

1. On the seed server: start the stack, grab `enode://...` and `enr:...` from logs:
   ```bash
   docker logs l1-execution | grep enode
   docker logs l1-consensus | grep enr
   ```
2. On the second machine: copy `artifacts/metadata/` from the seed.
3. Add to `.env` on the second machine:
   ```
   EL_BOOTNODES=enode://...
   CL_BOOTSTRAP_NODES=enr:...
   ```
4. Run steps 4–7 on the second machine.

## Security Notes

- `.env` is chmod 600 and gitignored — never commit it.
- The Consensus API port and metrics port are bound to `127.0.0.1` in docker-compose (not exposed publicly).
- The faucet validates private key format at startup and never exposes error internals in production.
- Blockscout DB password and `SECRET_KEY_BASE` are randomly generated per-deployment.

Server deployment guide (Cloudflare Tunnel, reverse proxy): see `DEPLOY_SERVER.md`.
