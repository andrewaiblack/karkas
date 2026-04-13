# Server Deployment (Cloudflare Tunnel)

This guide wires your testnet to:
- `rpc.marakyja.xyz` → JSON-RPC (MetaMask / dApps)
- `explorer.marakyja.xyz` → Blockscout
- `faucet.marakyja.xyz` → Faucet
- `site.marakyja.xyz` → Frontend (port 3000)

## 1) Update Cloudflared Ingress

Edit `/etc/cloudflared/config.yml`:

```yaml
ingress:
  - hostname: rpc.marakyja.xyz
    service: http://localhost:8545
  - hostname: explorer.marakyja.xyz
    service: http://localhost:4000
  - hostname: faucet.marakyja.xyz
    service: http://localhost:5000
  - hostname: site.marakyja.xyz
    service: http://localhost:3000
  - service: http_status:404
```

Restart tunnel:
```bash
sudo systemctl restart cloudflared
```

## 2) Install Docker (Ubuntu)

```bash
sudo apt update
sudo apt install -y docker.io docker-compose-plugin git
sudo usermod -aG docker $USER && newgrp docker
```

## 3) Configure secrets

```bash
# Faucet private key
cp .env.local.example .env.local
nano .env.local   # set FAUCET_PRIVATE_KEY

# Blockscout secrets
cp blockscout/.env.local.example blockscout/.env.local
nano blockscout/.env.local
# Generate SECRET_KEY_BASE: openssl rand -hex 64
```

## 4) Set faucet premine address

Edit `config/values.env`:
```bash
export EL_PREMINE_ADDRS='{"0xYOUR_FAUCET_ADDRESS":{"balance":"1000000000ETH"}}'
```

## 5) Generate Genesis + Start

```bash
chmod +x scripts/*.sh
./scripts/01-generate-genesis.sh
./scripts/02-generate-keys.sh
./scripts/03-init-geth.sh
./scripts/04-init-validator.sh
docker compose up -d
```

## 6) Start Blockscout

```bash
cd blockscout && docker compose up -d && cd ..
```

## 7) MetaMask Network Parameters

| Field | Value |
|---|---|
| Network Name | Karkas Testnet |
| RPC URL | `https://rpc.marakyja.xyz` |
| Chain ID | 144114 |
| Symbol | KRKS |
| Block Explorer | `https://explorer.marakyja.xyz` |

Or click **"Add to MetaMask"** on `https://site.marakyja.xyz`.

## 8) Faucet

Open `https://faucet.marakyja.xyz` — sends **1,000,000,000 KRKS** per request (1 per hour per IP).
