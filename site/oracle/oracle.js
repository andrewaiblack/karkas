/**
 * KRKS VRF Oracle
 * ───────────────
 * Listens for RequestRandom events on KRKSRoulette,
 * generates cryptographically secure random seeds,
 * signs them, and calls fulfillSpin().
 *
 * Security properties:
 *  - Seed generated AFTER seeing the request → cannot front-run
 *  - Seed signed with oracle private key → contract verifies via ecrecover
 *  - Seed mixed with future blockhash on-chain → oracle cannot bias result
 *  - Idempotent: duplicate requests silently skipped
 *  - Concurrency-safe: pending set prevents double-fulfillment
 *  - Exponential backoff on RPC failures
 *  - Graceful shutdown on SIGINT/SIGTERM
 */

import { ethers }     from "ethers";
import { randomBytes } from "crypto";
import { readFileSync } from "fs";
import dotenv          from "dotenv";
import path            from "path";
import { fileURLToPath } from "url";

dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".env") });

// ─── Config ───────────────────────────────────────────────────────────────────

const RPC_URL          = process.env.RPC_URL          || "https://rpc.marakyja.xyz";
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const ORACLE_PRIVKEY   = process.env.ORACLE_PRIVATE_KEY;
const CONFIRMATIONS    = parseInt(process.env.CONFIRMATIONS    || "2",   10);
const POLL_INTERVAL_MS = parseInt(process.env.POLL_INTERVAL_MS || "3000",10);
const MAX_RETRIES      = parseInt(process.env.MAX_RETRIES      || "5",   10);

if (!CONTRACT_ADDRESS) throw new Error("CONTRACT_ADDRESS not set in .env");
if (!ORACLE_PRIVKEY)   throw new Error("ORACLE_PRIVATE_KEY not set in .env");

// ─── ABI (only what the oracle needs) ────────────────────────────────────────

const ABI = [
  // Events
  "event RequestRandom(uint256 indexed id, address indexed player, uint256 bet, uint256 requestBlock)",
  "event SpinResult(uint256 indexed id, address indexed player, uint256 bet, uint256 payout, uint8 rarity, uint8 multX10)",

  // State reads
  "function oracle()    external view returns (address)",
  "function getRequest(uint256 id) external view returns (tuple(address player, uint256 bet, uint256 requestBlock, uint8 state))",
  "function TIMEOUT_BLOCKS() external view returns (uint256)",

  // Write
  "function fulfillSpin(uint256 id, bytes32 seed, uint8 v, bytes32 r, bytes32 s) external",
];

// ─── State ────────────────────────────────────────────────────────────────────

/** Set of requestIds currently being processed (prevents concurrent double-fulfillment) */
const processing = new Set();

let provider, wallet, contract, timeoutBlocks;
let running = true;
let lastBlock = 0n;

// ─── Logging ──────────────────────────────────────────────────────────────────

function log(level, msg, extra = {}) {
  const line = { ts: new Date().toISOString(), level, msg, ...extra };
  console.log(JSON.stringify(line));
}

// ─── Core ─────────────────────────────────────────────────────────────────────

/**
 * Generate a 32-byte cryptographically secure seed, sign it.
 * Signature covers: keccak256(id ‖ seed ‖ requestBlock)
 * This binds the seed to exactly one request so it cannot be replayed.
 */
async function signSeed(id, seed, requestBlock) {
  const inner = ethers.solidityPackedKeccak256(
    ["uint256", "bytes32", "uint256"],
    [id, seed, requestBlock]
  );
  // Sign the raw hash (we manually prepend the Ethereum prefix in Solidity)
  const sig = await wallet.signMessage(ethers.getBytes(inner));
  return ethers.Signature.from(sig);
}

/**
 * Fulfill a single spin request with retry + exponential backoff.
 */
async function fulfill(id, requestBlock) {
  if (processing.has(id)) return; // already in flight
  processing.add(id);

  try {
    // Verify request is still pending before doing anything
    const req = await contract.getRequest(id);
    if (req.state !== 0n) {
      log("info", "Request not pending — skipping", { id: id.toString() });
      return;
    }

    // Wait for the next block so blockhash(requestBlock+1) is available on-chain
    const currentBlock = await provider.getBlockNumber();
    if (BigInt(currentBlock) <= requestBlock) {
      log("info", "Waiting for next block", { id: id.toString() });
      await sleep(2000);
    }

    // Generate cryptographically secure seed
    const seed = "0x" + randomBytes(32).toString("hex");

    // Sign
    const sig = await signSeed(id, seed, requestBlock);
    log("info", "Seed signed", { id: id.toString(), rarity: "?" });

    // Send fulfillSpin with retries
    let attempt = 0;
    while (attempt < MAX_RETRIES) {
      try {
        const tx = await contract.fulfillSpin(id, seed, sig.v, sig.r, sig.s, {
          gasLimit: 300_000,
        });
        log("info", "fulfillSpin tx sent", { id: id.toString(), hash: tx.hash });

        const receipt = await tx.wait(CONFIRMATIONS);
        if (receipt.status === 1) {
          log("info", "fulfillSpin confirmed", { id: id.toString(), block: receipt.blockNumber });
        } else {
          log("error", "fulfillSpin reverted", { id: id.toString() });
        }
        return; // success
      } catch (err) {
        attempt++;
        const backoff = Math.min(1000 * 2 ** attempt, 30_000);
        log("warn", "fulfillSpin attempt failed", {
          id: id.toString(), attempt, err: err.shortMessage || err.message, backoff,
        });
        if (attempt >= MAX_RETRIES) throw err;
        await sleep(backoff);
      }
    }
  } catch (err) {
    log("error", "Failed to fulfill", { id: id.toString(), err: err.message });
  } finally {
    processing.delete(id);
  }
}

/**
 * Scan for RequestRandom events and fulfill them.
 */
async function poll() {
  try {
    const current  = BigInt(await provider.getBlockNumber());
    const fromBlock = lastBlock === 0n ? current - 1000n : lastBlock + 1n;
    if (fromBlock > current) return;

    const events = await contract.queryFilter(
      contract.filters.RequestRandom(),
      fromBlock,
      current
    );

    if (events.length > 0) {
      log("info", `Found ${events.length} request(s)`, { from: fromBlock.toString(), to: current.toString() });
    }

    for (const ev of events) {
      const id           = ev.args.id;
      const requestBlock = ev.args.requestBlock;

      // Skip if already processing or check burned/fulfilled on chain
      if (processing.has(id)) continue;

      try {
        const req = await contract.getRequest(id);
        if (req.state !== 0n) continue; // 0 = Pending
      } catch { continue; }

      // Check not expired
      const currentBlock = await provider.getBlockNumber();
      if (BigInt(currentBlock) > requestBlock + timeoutBlocks) {
        log("warn", "Request expired — skipping", { id: id.toString() });
        continue;
      }

      // Fulfill asynchronously
      fulfill(id, requestBlock).catch(err =>
        log("error", "Async fulfill error", { id: id.toString(), err: err.message })
      );
    }

    lastBlock = current;
  } catch (err) {
    log("error", "Poll error", { err: err.message });
  }
}

// ─── Init & main loop ─────────────────────────────────────────────────────────

async function init() {
  provider = new ethers.JsonRpcProvider(RPC_URL);
  wallet   = new ethers.Wallet(ORACLE_PRIVKEY, provider);
  contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, wallet);

  // Verify the oracle address matches the one in the contract
  const contractOracle = await contract.oracle();
  if (contractOracle.toLowerCase() !== wallet.address.toLowerCase()) {
    throw new Error(
      `Oracle key mismatch!\n  Contract oracle: ${contractOracle}\n  Our address:     ${wallet.address}`
    );
  }

  timeoutBlocks = await contract.TIMEOUT_BLOCKS();

  const network = await provider.getNetwork();
  log("info", "Oracle started", {
    network:  network.name,
    chainId:  network.chainId.toString(),
    oracle:   wallet.address,
    contract: CONTRACT_ADDRESS,
    timeout:  timeoutBlocks.toString(),
  });

  // Main poll loop
  while (running) {
    await poll();
    await sleep(POLL_INTERVAL_MS);
  }

  log("info", "Oracle stopped gracefully");
}

function sleep(ms) {
  return new Promise(res => setTimeout(res, ms));
}

// ─── Graceful shutdown ────────────────────────────────────────────────────────

process.on("SIGINT",  () => { log("info", "SIGINT received"); running = false; });
process.on("SIGTERM", () => { log("info", "SIGTERM received"); running = false; });

process.on("uncaughtException", err => {
  log("error", "Uncaught exception", { err: err.message, stack: err.stack });
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  log("error", "Unhandled rejection", { reason: String(reason) });
});

// ─── Entry ────────────────────────────────────────────────────────────────────

init().catch(err => {
  log("error", "Fatal init error", { err: err.message });
  process.exit(1);
});
