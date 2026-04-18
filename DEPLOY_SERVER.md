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

## 2) Generate Secrets (No Manual Keys)

This step auto-generates:
- Validator mnemonic
- Faucet private key + address
- Updates `config/values.env`, `.env`, and `config/el/genesis-config.yaml`

```bash
chmod +x scripts/*.sh
./scripts/00-init-secrets.sh
```

## 3) Generate Genesis & Start L1

```bash
./scripts/01-generate-genesis.sh

# Verify premine is set:
jq -r '.alloc["0xyour_faucet_address"]' artifacts/metadata/genesis.json

./scripts/02-generate-keys.sh
./scripts/03-init-geth.sh
./scripts/04-init-validator.sh
docker compose up -d
```

## 4) Start Blockscout

```bash
cd blockscout
docker compose up -d
```

## 5) Configure Cloudflare Tunnel

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

## 6) MetaMask Network Settings

- RPC URL: `https://rpc.marakyja.xyz`
- Chain ID: `144411`
- Symbol: `KRKS`
- Block Explorer: `https://explorer.marakyja.xyz`

Or use the **Add to MetaMask** button on the faucet page.

## Reset / Re-deploy

```bash
docker compose down
sudo rm -rf artifacts data/el data/cl data/validator validator-keys
# Then repeat step 3
```
