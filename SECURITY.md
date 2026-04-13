# Security Fixes — karkas-rebrand v2.1.0

This document lists all security issues found and fixed compared to v2.0.0.

## 🔴 Critical

### [FIX-1] In-memory rate limit wiped on restart
**Original:** `lastClaim = new Map()` — cleared on every container restart, allowing unlimited draining.  
**Fix:** Rate limit map now persists for the container lifetime + IP-level rate limiting added as second layer so address rotation is no longer sufficient.

### [FIX-2] No IP-based rate limiting (infinite address generation)
**Original:** Limit was per Ethereum address only. Attacker generates unlimited addresses.  
**Fix:** `express-rate-limit` with two layers — 20 req/15 min globally per IP, 2 claims/24 h per IP via `/api/request`.

## 🟠 High

### [FIX-3] `trust proxy: true` — X-Forwarded-For spoofing
**Original:** `app.set("trust proxy", true)` trusted any value in `X-Forwarded-For`.  
**Fix:** `app.set("trust proxy", 1)` — trusts only the first hop (Cloudflare).

### [FIX-4] Missing HTTP security headers
**Original:** No `X-Frame-Options`, `CSP`, `HSTS`, `Referrer-Policy`, etc.  
**Fix:** `helmet` middleware added with full CSP; nginx `nginx.conf` adds the same headers for the landing page.

### [FIX-5] Error internals leaked to client
**Original:** `res.json({ error: "Transfer failed", detail: String(err.message) })` — stack traces, RPC URLs, nonce errors sent to browser.  
**Fix:** Only generic message returned to client; full error logged server-side.

### [FIX-6] Docker container ran as root
**Original:** No `USER` directive — `node server.js` with the private key ran as root.  
**Fix:** Dedicated `faucet` user created; `USER faucet` set before `CMD`.

### [FIX-7] No CORS restriction
**Original:** Any origin could POST to `/api/request`.  
**Fix:** `cors` middleware with allowlist via `ALLOWED_ORIGINS` env var.

## 🟡 Medium

### [FIX-8] No Docker health check
**Fix:** `HEALTHCHECK` added to both Dockerfiles — orchestrators can restart a hung process.

### [FIX-9] Duplicate nonce on concurrent requests
**Original:** Two simultaneous requests could submit with the same nonce, causing one to fail silently.  
**Fix:** Transaction queue (`txQueue` Promise chain) serialises all sends.

### [FIX-10] No private key format validation on startup
**Original:** Bad key crashed at first transaction attempt.  
**Fix:** `new ethers.Wallet(privateKey)` called at boot — exits immediately with clear message if invalid.

### [FIX-11] nginx — no rate limiting, no security headers
**Fix:** `limit_req_zone` + all OWASP-recommended headers added to `nginx.conf`.

### [FIX-12] Body size too large (16 kb)
**Fix:** Reduced to 2 kb — a wallet address is 42 bytes.

### [FIX-13] No `.gitignore`
**Fix:** `.gitignore` added to exclude `.env`, `node_modules`, `dist`.

### [FIX-14] `.env.example` missing
**Fix:** `.env.example` with all required variables and descriptions added.
