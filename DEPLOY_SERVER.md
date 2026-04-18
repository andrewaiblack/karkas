# Server Deployment Guide

This guide sets up your L1 testnet with:
- `rpc.marakyja.xyz` → JSON-RPC (MetaMask / dApps)
- `explorer.marakyja.xyz` → Blockscout
- `faucet.marakyja.xyz` → Faucet
- `marakyja.xyz` → KARKAS landing page

## 1) Install Docker

```bash
sudo apt update
sudo apt install -y docker.io docker-compose-plugin
sudo usermod -aG docker $USER
newgrp docker
```

## 2) Edit network.config

Open `network.config` and set your domain:

```
BASE_DOMAIN=explorer.marakyja.xyz   # IMPORTANT: must be the explorer subdomain, not root domain
RPC_URL=https://rpc.marakyja.xyz
EXPLORER_URL=https://explorer.marakyja.xyz
CHAIN_ID=144411
CURRENCY_SYMBOL=KRKS
```

> ⚠️ `BASE_DOMAIN` must equal the explorer subdomain (e.g. `explorer.marakyja.xyz`),
> NOT the root domain (`marakyja.xyz`). Setting it to the root domain causes CORS errors
> because the frontend is served from `explorer.marakyja.xyz` but would try to call
> `marakyja.xyz/api/...` — a different origin.

## 3) Generate Secrets

```bash
bash scripts/00-init-secrets.sh
```

Generates and saves to `.env` (gitignored):
- Validator BIP-39 mnemonic
- Faucet private key + Ethereum address
- JWT secret
- Blockscout DB password + secret key base

Safe to re-run — existing values are never overwritten.

## 4) Generate Genesis & Start L1

```bash
bash scripts/01-generate-genesis.sh
bash scripts/02-generate-keys.sh
bash scripts/03-init-geth.sh
bash scripts/04-init-validator.sh
docker compose up -d
```

## 5) Start Blockscout

```bash
cd blockscout
docker compose --env-file ../.env up -d
```

> Always pass `--env-file ../.env` so Blockscout picks up all secrets.

## 6) Configure Cloudflare Tunnel

Edit `/etc/cloudflared/config.yml`:

```yaml
ingress:
  - hostname: rpc.marakyja.xyz
    service: http://localhost:8545
  - hostname: marakyja.xyz
    service: http://localhost:3000
  - hostname: explorer.marakyja.xyz
    service: http://localhost:4000
  - hostname: faucet.marakyja.xyz
    service: http://localhost:5000
  - service: http_status:404
```

```bash
sudo systemctl restart cloudflared
```

## 7) MetaMask Network Settings

- RPC URL: `https://rpc.marakyja.xyz`
- Chain ID: `144411`
- Symbol: `KRKS`
- Block Explorer: `https://explorer.marakyja.xyz`

## Reset / Re-deploy

```bash
docker compose down -v
cd blockscout && docker compose --env-file ../.env down -v && cd ..
sudo rm -rf artifacts data/el data/cl data/validator validator-keys .env
# Then repeat from step 3
```
