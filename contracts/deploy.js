#!/usr/bin/env node
/**
 * deploy.js — Compile & deploy KRKSRoulette to KARKAS testnet.
 *
 * Prerequisites:  npm install -g solc
 *
 * Usage:
 *   OWNER_PRIVATE_KEY=0x...  \
 *   ORACLE_ADDRESS=0x...     \
 *   SEED_KRKS=50             \
 *   node contracts/deploy.js
 *
 * After deploy, update:
 *   src/config/network.js  →  ROULETTE_ADDRESS
 *   oracle/.env            →  CONTRACT_ADDRESS
 */

import { ethers }    from "ethers";
import { execSync }  from "child_process";
import { readFileSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath }    from "url";

const __dir = dirname(fileURLToPath(import.meta.url));

const OWNER_KEY      = process.env.OWNER_PRIVATE_KEY;
const ORACLE_ADDRESS = process.env.ORACLE_ADDRESS;
const SEED_KRKS      = process.env.SEED_KRKS  || "50";
const RPC_URL        = process.env.RPC_URL     || "https://rpc.marakyja.xyz";

if (!OWNER_KEY)      { console.error("Set OWNER_PRIVATE_KEY"); process.exit(1); }
if (!ORACLE_ADDRESS) { console.error("Set ORACLE_ADDRESS");    process.exit(1); }

const SOL_PATH = resolve(__dir, "KRKSRoulette.sol");
const OUT_DIR  = "/tmp/krks-solc";
mkdirSync(OUT_DIR, { recursive: true });

console.log("Compiling…");
execSync(
  `npx solcjs --optimize --optimize-runs 200 --bin --abi "${SOL_PATH}" --output-dir "${OUT_DIR}"`,
  { stdio: "inherit" }
);

const base     = OUT_DIR + "/contracts_KRKSRoulette_sol_KRKSRoulette";
const abi      = JSON.parse(readFileSync(base + ".abi", "utf8"));
const bytecode = "0x" + readFileSync(base + ".bin", "utf8").trim();

const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet   = new ethers.Wallet(OWNER_KEY, provider);
const seedWei  = ethers.parseEther(SEED_KRKS);

const bal = await provider.getBalance(wallet.address);
console.log(`Owner:   ${wallet.address}`);
console.log(`Balance: ${ethers.formatEther(bal)} KRKS`);
console.log(`Oracle:  ${ORACLE_ADDRESS}`);
console.log(`Seeding: ${SEED_KRKS} KRKS`);

const factory  = new ethers.ContractFactory(abi, bytecode, wallet);
const contract = await factory.deploy(ORACLE_ADDRESS, { value: seedWei });
console.log(`Tx: ${contract.deploymentTransaction().hash}`);
await contract.waitForDeployment();
const address = await contract.getAddress();

console.log(`\nDeployed: ${address}`);
console.log(`Explorer: https://explorer.marakyja.xyz/address/${address}`);
console.log(`\nUpdate src/config/network.js  →  ROULETTE_ADDRESS: "${address}"`);
console.log(`Update oracle/.env            →  CONTRACT_ADDRESS=${address}`);
