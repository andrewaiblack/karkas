# PoS EVM L1 Testnet (Geth + Lighthouse)

This is a full local PoS L1 testnet with EVM. Execution Layer = Geth, Consensus/Validator = Lighthouse. Genesis is generated with `ethereum-genesis-generator`, and validator keys are generated with `eth2-val-tools`.

## Quick Start (single machine)

0. Generate secrets (mnemonic + faucet key):
   ```powershell
   powershell -ExecutionPolicy Bypass -File scripts/00-init-secrets.ps1
   ```
1. Generate genesis + configs:
   ```powershell
   powershell -ExecutionPolicy Bypass -File scripts/01-generate-genesis.ps1
   ```
2. Generate validator keys:
   ```powershell
   powershell -ExecutionPolicy Bypass -File scripts/02-generate-keys.ps1
   ```
3. Initialize the geth datadir:
   ```powershell
   powershell -ExecutionPolicy Bypass -File scripts/03-init-geth.ps1
   ```
4. Copy validator keys into the datadir:
   ```powershell
   powershell -ExecutionPolicy Bypass -File scripts/04-init-validator.ps1
   ```
5. Start the nodes:
   ```powershell
   docker compose up -d
   ```

## What appears in `artifacts/`

The generator produces:

1. `artifacts/metadata/genesis.json` (EL genesis)
2. `artifacts/metadata/genesis.ssz` and `artifacts/metadata/config.yaml` (CL genesis + config)
3. `artifacts/jwt/jwtsecret` (JWT secret for EL<->CL)
4. `artifacts/metadata/deposit_contract.txt` (deposit contract address)

## Add More Validators

1. Generate extra keys (example indices 8..12):
   ```powershell
   docker run --rm -v "$PWD/validator-keys-extra:/out" `
     --entrypoint /usr/local/bin/eth2-val-tools `
     ethpandaops/ethereum-genesis-generator:master `
     keystores `
     --source-mnemonic="YOUR_MNEMONIC" `
     --source-min=8 --source-max=12 `
     --out-loc /out/assigned_data --insecure
   ```
2. Copy `validator-keys-extra/assigned_data/keys` into `data/validator/validators` and
   `validator-keys-extra/assigned_data/secrets` into `data/validator/secrets`.
3. Generate deposit-data for those validators:
   ```powershell
   docker run --rm ethpandaops/ethereum-genesis-generator:master `
     eth2-val-tools deposit-data `
     --validators-mnemonic="YOUR_MNEMONIC" `
     --withdrawals-mnemonic="YOUR_MNEMONIC" `
     --source-min=8 --source-max=12 `
     --fork-version=0x10000000 `
     --withdrawal-credentials-type=0x00
   ```
4. Send each deposit-data as a deposit transaction to the deposit contract.

After deposits are included, validators activate and start earning rewards.

## Second Machine (separate node/validator)

1. On the seed server, start nodes and get `enode://...` and `enr:...` from logs:
   ```powershell
   docker logs l1-execution
   docker logs l1-consensus
   ```
2. On the second machine, copy the same `artifacts/metadata` (genesis + config) from the seed machine, or regenerate with the exact same `config/values.env`.
3. On the second machine, set in `.env`:
   ```
   EL_BOOTNODES=enode://...
   CL_BOOTSTRAP_NODES=enr:...
   ```
4. Repeat key generation and startup steps.

## Notes

This project uses the official Docker images `ethereum/client-go` and `sigp/lighthouse`.

---

If you want, I can add:
1. A deposit automation script.
2. Prometheus + Grafana.
3. A full multi-node automation script.

Server deployment guide (Cloudflare Tunnel, Blockscout, Faucet): see `DEPLOY_SERVER.md`.
