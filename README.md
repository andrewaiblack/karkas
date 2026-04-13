# Karkas Testnet — PoS EVM L1

Full PoS EVM testnet: **Execution = Geth**, **Consensus + Validator = Lighthouse**, **Explorer = Blockscout**, **Frontend = React + Tailwind**.

| | |
|---|---|
| **Token** | KRKS (Karkas) |
| **Chain ID** | 144114 |
| **Faucet amount** | 1,000,000,000 KRKS per request |

---

## Services

| Service | Port | Public URL |
|---|---|---|
| Geth JSON-RPC HTTP | 8545 | `https://rpc.marakyja.xyz` |
| Geth WebSocket | 8546 | `wss://rpc.marakyja.xyz` |
| Lighthouse Beacon | 5052 | internal |
| Blockscout | 4000 | `https://explorer.marakyja.xyz` |
| Faucet | 5000 | `https://faucet.marakyja.xyz` |
| Frontend | 3000 | `https://site.marakyja.xyz` |

---

## First-Time Setup (Ubuntu)

### 1. Prerequisites

```bash
sudo apt update
sudo apt install -y docker.io docker-compose-plugin git
sudo usermod -aG docker $USER && newgrp docker
```

### 2. Clone

```bash
git clone https://github.com/YOUR_USER/karkas-testnet.git
cd karkas-testnet
```

### 3. Generate your mnemonic

```bash
docker run --rm ethpandaops/ethereum-genesis-generator:master \
  eth2-val-tools mnemonic
```

Paste the output into `config/values.env` as `EL_AND_CL_MNEMONIC`.

### 4. Configure secrets

```bash
# Faucet private key
cp .env.local.example .env.local
nano .env.local   # set FAUCET_PRIVATE_KEY=0x...

# Blockscout
cp blockscout/.env.local.example blockscout/.env.local
nano blockscout/.env.local
# SECRET_KEY_BASE: run ->  openssl rand -hex 64
```

### 5. Set faucet premine address

In `config/values.env`:
```bash
export EL_PREMINE_ADDRS='{"0xYOUR_FAUCET_WALLET_ADDRESS":{"balance":"1000000000ETH"}}'
```

### 6. Generate genesis + keys

```bash
chmod +x scripts/*.sh
./scripts/01-generate-genesis.sh
./scripts/02-generate-keys.sh
./scripts/03-init-geth.sh
./scripts/04-init-validator.sh
```

### 7. Start everything

```bash
# L1 nodes + frontend
docker compose up -d

# Blockscout (separate compose)
cd blockscout && docker compose up -d && cd ..
```

### 8. Cloudflare Tunnel

See `DEPLOY_SERVER.md`.

---

## MetaMask

| Field | Value |
|---|---|
| Network Name | Karkas Testnet |
| RPC URL | `https://rpc.marakyja.xyz` |
| Chain ID | 144114 |
| Symbol | KRKS |
| Explorer | `https://explorer.marakyja.xyz` |

Or click **"Add to MetaMask"** on `https://site.marakyja.xyz`.

---

## Frontend Development

```bash
cd frontend
npm install
npm run dev      # http://localhost:5173
npm run build    # → dist/
```

---

## Security Checklist

- [ ] `.env.local` is **not** committed (contains `FAUCET_PRIVATE_KEY`)
- [ ] `blockscout/.env.local` is **not** committed (contains DB password + `SECRET_KEY_BASE`)
- [ ] `EL_AND_CL_MNEMONIC` in `config/values.env` is **your own generated mnemonic**
- [ ] `EL_PREMINE_ADDRS` uses **your faucet wallet address**, not the placeholder
- [ ] `artifacts/` and `data/` are **not** committed (generated on deploy)
- [ ] `validator-keys/` is **not** committed

---

## Add More Validators

```bash
docker run --rm -v "$PWD/validator-keys-extra:/out" \
  --entrypoint /usr/local/bin/eth2-val-tools \
  ethpandaops/ethereum-genesis-generator:master \
  keystores \
  --source-mnemonic="YOUR_MNEMONIC" \
  --source-min=8 --source-max=12 \
  --out-loc /out/assigned_data --insecure

cp -r validator-keys-extra/assigned_data/keys/* data/validator/validators/
cp -r validator-keys-extra/assigned_data/secrets/* data/validator/secrets/
```
