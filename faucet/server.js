import express from "express";
import rateLimit from "express-rate-limit";
import { ethers } from "ethers";

const app = express();

// Security: trust only first proxy (Cloudflare / nginx)
app.set("trust proxy", 1);

// Body parsers with reasonable limits
app.use(express.json({ limit: "16kb" }));

// ---------------------------------------------------------------------------
// Config — all from environment, no fallbacks that leak secrets
// ---------------------------------------------------------------------------
const rpcUrl     = process.env.RPC_URL          || "http://execution:8545";
const privateKey = process.env.FAUCET_PRIVATE_KEY;
const chainId    = Number(process.env.FAUCET_CHAIN_ID         || "144114");
const amountWei  = BigInt(process.env.FAUCET_AMOUNT_WEI        || "1000000000000000000000000000");
const rateLimitS = Number(process.env.FAUCET_RATE_LIMIT_SECONDS|| "3600");
const port       = Number(process.env.FAUCET_PORT              || "5000");

if (!privateKey) {
  console.error("[faucet] FATAL: FAUCET_PRIVATE_KEY is not set. Exiting.");
  process.exit(1);
}

const provider = new ethers.JsonRpcProvider(rpcUrl, chainId);
const wallet   = new ethers.Wallet(privateKey, provider);

// ---------------------------------------------------------------------------
// Rate limiter — 1 request per IP per window
// ---------------------------------------------------------------------------
const limiter = rateLimit({
  windowMs: rateLimitS * 1000,
  max: 1,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Rate limit exceeded. Try again later." },
});

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------
app.get("/health", (_req, res) => res.json({ ok: true }));

app.get("/", (_req, res) => {
  // Format amount safely for display (avoid Number overflow for large values)
  const amountKRKS = amountWei / BigInt(10 ** 18);
  const amount = amountKRKS.toLocaleString();
  res.type("html").send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>Karkas Faucet</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:system-ui,sans-serif;background:#0f172a;color:#e2e8f0;display:flex;justify-content:center;align-items:center;min-height:100vh;padding:1rem}
    .card{background:#1e293b;border:1px solid #334155;border-radius:12px;padding:2rem;width:100%;max-width:480px}
    h1{font-size:1.5rem;margin-bottom:.5rem}
    p{color:#94a3b8;margin-bottom:1.5rem;font-size:.9rem}
    input{width:100%;padding:.75rem 1rem;background:#0f172a;border:1px solid #334155;border-radius:8px;color:#e2e8f0;font-size:1rem;margin-bottom:1rem}
    input:focus{outline:2px solid #6366f1;border-color:#6366f1}
    button{width:100%;padding:.75rem;background:#6366f1;border:none;border-radius:8px;color:#fff;font-size:1rem;font-weight:600;cursor:pointer}
    button:hover{background:#4f46e5}
    #msg{margin-top:1rem;padding:.75rem;border-radius:8px;font-size:.875rem;display:none}
    .ok{background:#166534;color:#bbf7d0}
    .err{background:#7f1d1d;color:#fecaca}
  </style>
</head>
<body>
  <div class="card">
    <h1>💧 Karkas Faucet</h1>
    <p>Receive ${amount} KRKS on the Karkas Testnet (Chain ID: ${chainId}).</p>
    <input id="addr" placeholder="0x..." autocomplete="off"/>
    <button onclick="request()">Request Tokens</button>
    <div id="msg"></div>
  </div>
  <script>
    async function request() {
      const addr = document.getElementById('addr').value.trim();
      const msg  = document.getElementById('msg');
      msg.style.display='none';
      try {
        const r = await fetch('/request', {
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body: JSON.stringify({address: addr})
        });
        const d = await r.json();
        if (d.ok) {
          msg.className='ok'; msg.textContent='Sent! Tx: ' + d.txHash;
        } else {
          msg.className='err'; msg.textContent=d.error || 'Error';
        }
      } catch(e) {
        msg.className='err'; msg.textContent='Network error';
      }
      msg.style.display='block';
    }
  </script>
</body>
</html>`);
});

app.post("/request", limiter, express.json(), async (req, res) => {
  const address = (req.body?.address || "").trim();

  if (!ethers.isAddress(address)) {
    return res.status(400).json({ error: "Invalid Ethereum address" });
  }

  try {
    const tx = await wallet.sendTransaction({ to: address, value: amountWei });
    return res.json({ ok: true, txHash: tx.hash });
  } catch (err) {
    console.error("[faucet] sendTransaction failed:", err?.message || err);
    return res.status(500).json({ error: "Transfer failed. Check server logs." });
  }
});

// 404 catch-all
app.use((_req, res) => res.status(404).json({ error: "Not found" }));

app.listen(port, "0.0.0.0", () => {
  console.log(`[karkas-faucet] Listening on 0.0.0.0:${port} | chain=${chainId}`);
});
