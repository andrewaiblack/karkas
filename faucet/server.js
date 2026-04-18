import express from "express";
import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// Trust one level of reverse proxy (nginx/Cloudflare Tunnel)
app.set("trust proxy", 1);
app.use(express.json({ limit: "4kb" }));

// ── Config — all values from environment, no hardcoded defaults ──────────────

const rpcUrl       = process.env.RPC_URL;
const privateKey   = process.env.FAUCET_PRIVATE_KEY;
const chainId      = Number(process.env.CHAIN_ID);
const amountWei    = BigInt(process.env.FAUCET_AMOUNT_WEI   || "1000000000000000000");
const port         = Number(process.env.FAUCET_PORT         || "5000");
const rateLimitMs  = Number(process.env.FAUCET_RATE_LIMIT_HOURS || "24") * 60 * 60 * 1000;
const statePath    = process.env.FAUCET_STATE_PATH || path.join(__dirname, "data", "claims.json");

// Validate required config at startup — fail fast with a clear message
if (!rpcUrl)      { console.error("FATAL: RPC_URL is not set");           process.exit(1); }
if (!privateKey)  { console.error("FATAL: FAUCET_PRIVATE_KEY is not set. Run scripts/00-init-secrets.sh"); process.exit(1); }
if (!chainId)     { console.error("FATAL: CHAIN_ID is not set");          process.exit(1); }

// Validate private key format before constructing Wallet (prevents crash on bad value)
if (!/^0x[0-9a-fA-F]{64}$/.test(privateKey)) {
  console.error("FATAL: FAUCET_PRIVATE_KEY is not a valid 32-byte hex private key");
  process.exit(1);
}

const provider = new ethers.JsonRpcProvider(rpcUrl, chainId);
const wallet   = new ethers.Wallet(privateKey, provider);

// ── Persistence ──────────────────────────────────────────────────────────────

// Map: normalised_address -> timestamp_ms of last successful claim
const lastClaim = new Map();

function loadClaims() {
  try {
    const raw  = fs.readFileSync(statePath, "utf-8");
    const data = JSON.parse(raw);
    if (data && typeof data === "object") {
      for (const [addr, ts] of Object.entries(data)) {
        if (typeof ts === "number") lastClaim.set(addr, ts);
      }
    }
    console.log(`Loaded ${lastClaim.size} prior claims from ${statePath}`);
  } catch {
    // First run or file not yet created — this is normal
  }
}

let persistTimer = null;
function persistClaims() {
  if (persistTimer) return;
  persistTimer = setTimeout(() => {
    persistTimer = null;
    try {
      fs.mkdirSync(path.dirname(statePath), { recursive: true });
      const obj = Object.fromEntries(lastClaim.entries());
      fs.writeFileSync(statePath, JSON.stringify(obj, null, 2));
    } catch (err) {
      console.error("Failed to persist faucet claims:", err?.message || err);
    }
  }, 500);
}

loadClaims();

// Prune expired entries every hour to prevent unbounded memory growth
setInterval(() => {
  const now = Date.now();
  let pruned = 0;
  for (const [addr, ts] of lastClaim.entries()) {
    if (now - ts > rateLimitMs) { lastClaim.delete(addr); pruned++; }
  }
  if (pruned > 0) { persistClaims(); }
}, 60 * 60 * 1000);

// ── Static assets ─────────────────────────────────────────────────────────────

app.use(express.static(path.join(__dirname, "dist")));

// ── API endpoints ─────────────────────────────────────────────────────────────

app.get("/api/info", (_req, res) => {
  res.json({
    chainId,
    amountWei:    amountWei.toString(),
    amountEth:    ethers.formatEther(amountWei),
    symbol:       process.env.CURRENCY_SYMBOL       || "ETH",
    networkName:  process.env.CURRENCY_NAME         || "Testnet",
    rpcUrl:       process.env.RPC_URL               || "",
    explorerUrl:  process.env.EXPLORER_URL          || "",
    rateLimitHours: rateLimitMs / (60 * 60 * 1000),
  });
});

app.get("/api/status/:address", (req, res) => {
  const raw = req.params.address;

  // Validate format before doing anything with it
  if (!ethers.isAddress(raw)) {
    return res.status(400).json({ error: "Invalid Ethereum address" });
  }

  const address = raw.toLowerCase();
  const last    = lastClaim.get(address);
  if (!last) return res.json({ canClaim: true, nextClaimAt: null });

  const nextClaimAt = last + rateLimitMs;
  const canClaim    = Date.now() >= nextClaimAt;
  res.json({ canClaim, nextClaimAt: canClaim ? null : nextClaimAt });
});

app.post("/api/request", async (req, res) => {
  const raw = (req.body?.address || "").trim();

  // Validate Ethereum address
  if (!ethers.isAddress(raw)) {
    return res.status(400).json({ error: "Invalid Ethereum address" });
  }

  const address = raw.toLowerCase();

  // Rate-limit check
  const last = lastClaim.get(address);
  if (last) {
    const nextClaimAt = last + rateLimitMs;
    if (Date.now() < nextClaimAt) {
      return res.status(429).json({
        error: `Rate limit: 1 request per ${rateLimitMs / (60 * 60 * 1000)} hours per address`,
        nextClaimAt,
      });
    }
  }

  try {
    const tx = await wallet.sendTransaction({ to: address, value: amountWei });
    lastClaim.set(address, Date.now());
    persistClaims();
    return res.json({ ok: true, txHash: tx.hash });
  } catch (err) {
    console.error("Transfer failed:", err?.message);
    // Never expose internal error details in production
    const detail = process.env.NODE_ENV !== "production"
      ? String(err?.message || err)
      : undefined;
    return res.status(500).json({ error: "Transfer failed", detail });
  }
});

// SPA fallback
app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Faucet listening on 0.0.0.0:${port}`);
  console.log(`  Chain ID  : ${chainId}`);
  console.log(`  RPC URL   : ${rpcUrl}`);
  console.log(`  Amount    : ${ethers.formatEther(amountWei)} ETH per request`);
  console.log(`  Rate limit: ${rateLimitMs / (60 * 60 * 1000)}h`);
});
