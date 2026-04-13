import express from "express";
import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.set("trust proxy", true);
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: false }));

// Serve static React build
app.use(express.static(path.join(__dirname, "dist")));

const rpcUrl = process.env.RPC_URL || "http://execution:8545";
const privateKey = process.env.FAUCET_PRIVATE_KEY || "";
const chainId = Number(process.env.FAUCET_CHAIN_ID || "144411");
const amountWei = BigInt(process.env.FAUCET_AMOUNT_WEI || "1000000000000000000");
const port = Number(process.env.FAUCET_PORT || "5000");
const RATE_LIMIT_MS = 24 * 60 * 60 * 1000; // 24h per address
const statePath =
  process.env.FAUCET_STATE_PATH || path.join(__dirname, "data", "claims.json");

if (!privateKey) {
  console.error("FAUCET_PRIVATE_KEY is required. Run scripts/00-init-secrets.sh first.");
  process.exit(1);
}

const provider = new ethers.JsonRpcProvider(rpcUrl, chainId);
const wallet = new ethers.Wallet(privateKey, provider);

// Per-address cooldown map (persisted to disk)
const lastClaim = new Map();

function loadClaims() {
  try {
    const raw = fs.readFileSync(statePath, "utf-8");
    const data = JSON.parse(raw);
    if (data && typeof data === "object") {
      for (const [addr, ts] of Object.entries(data)) {
        if (typeof ts === "number") lastClaim.set(addr, ts);
      }
    }
  } catch {
    // first run or invalid file
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

// Cleanup stale entries every hour
setInterval(() => {
  const now = Date.now();
  let changed = false;
  for (const [addr, ts] of lastClaim.entries()) {
    if (now - ts > RATE_LIMIT_MS) {
      lastClaim.delete(addr);
      changed = true;
    }
  }
  if (changed) persistClaims();
}, 60 * 60 * 1000);

app.get("/api/info", (_req, res) => {
  res.json({
    chainId,
    amountWei: amountWei.toString(),
    amountEth: ethers.formatEther(amountWei),
    symbol: process.env.FAUCET_SYMBOL || "KRKS",
    networkName: process.env.FAUCET_NETWORK_NAME || "KARKAS",
    rpcUrl: process.env.FAUCET_PUBLIC_RPC || "https://rpc.marakyja.xyz",
    explorerUrl: process.env.FAUCET_EXPLORER_URL || "https://explorer.marakyja.xyz",
    rateLimitHours: 24,
  });
});

app.get("/api/status/:address", (req, res) => {
  const address = req.params.address.toLowerCase();
  const last = lastClaim.get(address);
  if (!last) return res.json({ canClaim: true, nextClaimAt: null });
  const nextClaimAt = last + RATE_LIMIT_MS;
  const canClaim = Date.now() >= nextClaimAt;
  res.json({ canClaim, nextClaimAt: canClaim ? null : nextClaimAt });
});

app.post("/api/request", async (req, res) => {
  const address = (req.body?.address || "").trim();

  if (!ethers.isAddress(address)) {
    return res.status(400).json({ error: "Invalid Ethereum address" });
  }

  const key = address.toLowerCase();
  const last = lastClaim.get(key);
  if (last) {
    const nextClaimAt = last + RATE_LIMIT_MS;
    if (Date.now() < nextClaimAt) {
      return res.status(429).json({
        error: "Rate limit: 1 request per 24 hours per address",
        nextClaimAt,
      });
    }
  }

  try {
    const tx = await wallet.sendTransaction({ to: address, value: amountWei });
    lastClaim.set(key, Date.now());
    persistClaims();
    return res.json({ ok: true, txHash: tx.hash });
  } catch (err) {
    console.error("Transfer failed:", err?.message);
    return res.status(500).json({
      error: "Transfer failed",
      detail: process.env.NODE_ENV === "production" ? undefined : String(err?.message || err),
    });
  }
});

// SPA fallback
app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Faucet listening on 0.0.0.0:${port}`);
});
