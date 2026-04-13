import express from "express";
import { ethers } from "ethers";
import path from "path";
import { fileURLToPath } from "url";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// ─── Config ──────────────────────────────────────────────────────────────────
const rpcUrl      = process.env.RPC_URL             || "http://execution:8545";
const privateKey  = process.env.FAUCET_PRIVATE_KEY  || "";
const chainId     = Number(process.env.FAUCET_CHAIN_ID   || "444114");
const amountWei   = BigInt(process.env.FAUCET_AMOUNT_WEI || "1000000000000000000");
const port        = Number(process.env.FAUCET_PORT        || "5000");
const publicRpc   = process.env.FAUCET_PUBLIC_RPC    || "https://rpc.marakyja.xyz";
const explorerUrl = process.env.FAUCET_EXPLORER_URL  || "https://explorer.marakyja.xyz";
const RATE_LIMIT_MS = 24 * 60 * 60 * 1000;

// FIX #1 — validate private key on startup (fail fast, not mid-request)
if (!privateKey) {
  console.error("FATAL: FAUCET_PRIVATE_KEY is required.");
  process.exit(1);
}
try {
  new ethers.Wallet(privateKey);
} catch {
  console.error("FATAL: FAUCET_PRIVATE_KEY is not a valid Ethereum private key.");
  process.exit(1);
}

// ─── Provider / Wallet ───────────────────────────────────────────────────────
const provider = new ethers.JsonRpcProvider(rpcUrl, chainId);
const wallet   = new ethers.Wallet(privateKey, provider);

// FIX #2 — Transaction nonce queue: serialise txs to prevent duplicate-nonce
// errors when two requests arrive simultaneously.
let txQueue = Promise.resolve();
function enqueueTransaction(to, value) {
  const tx = txQueue.then(() => wallet.sendTransaction({ to, value }));
  txQueue = tx.catch(() => {});
  return tx;
}

// FIX #3 — trust only the FIRST proxy hop (Cloudflare/nginx).
// Original "true" trusted any X-Forwarded-For an attacker could forge.
app.set("trust proxy", 1);

// FIX #4 — HTTP security headers via helmet
const allowedOrigins = (process.env.ALLOWED_ORIGINS || "https://faucet.marakyja.xyz")
  .split(",").map((o) => o.trim()).filter(Boolean);

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc:     ["'self'"],
        scriptSrc:      ["'self'", "'unsafe-inline'"],
        styleSrc:       ["'self'", "'unsafe-inline'"],
        connectSrc:     ["'self'", publicRpc, explorerUrl],
        imgSrc:         ["'self'", "data:"],
        fontSrc:        ["'self'"],
        objectSrc:      ["'none'"],
        frameAncestors: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

// FIX #5 — CORS: only allow listed origins
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      cb(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST"],
  })
);

// Reduced body limit — a wallet address is 42 chars, we need almost nothing
app.use(express.json({ limit: "2kb" }));
app.use(express.urlencoded({ extended: false, limit: "2kb" }));
app.use(express.static(path.join(__dirname, "dist")));

// FIX #6 — IP-based rate limiting (blocks infinite-address-generation attack)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests from this IP, slow down." },
  skip: (req) => req.path === "/api/info" || req.path === "/healthz",
});
app.use("/api", apiLimiter);

const claimLimiter = rateLimit({
  windowMs: RATE_LIMIT_MS,
  max: 2,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Claim limit reached for this IP. Try again in 24 hours." },
});

// ─── Per-address claim tracking ───────────────────────────────────────────────
const lastClaim = new Map();
setInterval(() => {
  const now = Date.now();
  for (const [addr, ts] of lastClaim.entries()) {
    if (now - ts > RATE_LIMIT_MS) lastClaim.delete(addr);
  }
}, 60 * 60 * 1000);

// ─── Routes ───────────────────────────────────────────────────────────────────
app.get("/healthz", (_req, res) => res.json({ ok: true }));

app.get("/api/info", (_req, res) => {
  res.json({
    chainId,
    amountWei:      amountWei.toString(),
    amountEth:      ethers.formatEther(amountWei),
    symbol:         "KRKS",
    networkName:    "Karkas Testnet",
    rpcUrl:         publicRpc,
    explorerUrl,
    rateLimitHours: 24,
  });
});

app.get("/api/status/:address", (req, res) => {
  const raw = req.params.address;
  if (!ethers.isAddress(raw)) return res.status(400).json({ error: "Invalid Ethereum address" });
  const address = raw.toLowerCase();
  const last = lastClaim.get(address);
  if (!last) return res.json({ canClaim: true, nextClaimAt: null });
  const nextClaimAt = last + RATE_LIMIT_MS;
  const canClaim    = Date.now() >= nextClaimAt;
  res.json({ canClaim, nextClaimAt: canClaim ? null : nextClaimAt });
});

app.post("/api/request", claimLimiter, async (req, res) => {
  // FIX #7 — truncate input before processing (defense-in-depth)
  const raw = (req.body?.address ?? "").toString().trim().slice(0, 42);
  if (!ethers.isAddress(raw)) {
    return res.status(400).json({ error: "Invalid Ethereum address" });
  }

  const address = raw.toLowerCase();
  const last    = lastClaim.get(address);
  if (last) {
    const nextClaimAt = last + RATE_LIMIT_MS;
    if (Date.now() < nextClaimAt) {
      return res.status(429).json({ error: "Rate limit: 1 request per 24 hours per address", nextClaimAt });
    }
  }

  try {
    const tx = await enqueueTransaction(address, amountWei);
    lastClaim.set(address, Date.now());
    return res.json({ ok: true, txHash: tx.hash });
  } catch (err) {
    // FIX #8 — log full error server-side; NEVER send internal details to client.
    // Original code sent err.message which exposed RPC internals and stack traces.
    console.error("Transfer failed:", err?.message);
    return res.status(500).json({ error: "Transfer failed. Please try again later." });
  }
});

app.get("*", (_req, res) =>
  res.sendFile(path.join(__dirname, "dist", "index.html"))
);

app.listen(port, "0.0.0.0", () => {
  console.log(`Karkas Faucet :${port} | wallet: ${wallet.address}`);
});
