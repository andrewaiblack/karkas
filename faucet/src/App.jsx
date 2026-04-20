import { useState, useEffect } from "react";

function formatCountdown(ms) {
  if (ms <= 0) return "now";
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${h}h ${m}m ${s}s`;
}

/* ── Brand Logo ─────────────────────────────────────────── */
function KarkasLogo({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="14" stroke="#427AB5" strokeWidth="1.5" fill="none"/>
      <circle cx="32" cy="32" r="4" fill="#427AB5"/>
      <circle cx="32" cy="8"  r="3.5" fill="#5B9BD5" opacity="0.9"/>
      <circle cx="32" cy="56" r="3.5" fill="#5B9BD5" opacity="0.9"/>
      <circle cx="8"  cy="32" r="3.5" fill="#5B9BD5" opacity="0.9"/>
      <circle cx="56" cy="32" r="3.5" fill="#5B9BD5" opacity="0.9"/>
      {[[18,18],[46,18],[18,46],[46,46]].map(([x,y],i) => (
        <polygon key={i} points={`${x},${y-5} ${x+5},${y} ${x},${y+5} ${x-5},${y}`} fill="#F7DD7D" opacity="0.85"/>
      ))}
      <line x1="32" y1="11" x2="32" y2="18" stroke="#427AB5" strokeWidth="1" opacity="0.4"/>
      <line x1="32" y1="46" x2="32" y2="53" stroke="#427AB5" strokeWidth="1" opacity="0.4"/>
      <line x1="11" y1="32" x2="18" y2="32" stroke="#427AB5" strokeWidth="1" opacity="0.4"/>
      <line x1="46" y1="32" x2="53" y2="32" stroke="#427AB5" strokeWidth="1" opacity="0.4"/>
      <line x1="22" y1="22" x2="18" y2="18" stroke="#F7DD7D" strokeWidth="1" opacity="0.35"/>
      <line x1="42" y1="22" x2="46" y2="18" stroke="#F7DD7D" strokeWidth="1" opacity="0.35"/>
      <line x1="22" y1="42" x2="18" y2="46" stroke="#F7DD7D" strokeWidth="1" opacity="0.35"/>
      <line x1="42" y1="42" x2="46" y2="46" stroke="#F7DD7D" strokeWidth="1" opacity="0.35"/>
    </svg>
  );
}

/* ── Main App ───────────────────────────────────────────── */
export default function App() {
  const [info, setInfo]           = useState(null);
  const [address, setAddress]     = useState("");
  const [status, setStatus]       = useState(null);
  const [loading, setLoading]     = useState(false);
  const [result, setResult]       = useState(null);
  const [countdown, setCountdown] = useState("");
  const [addingNetwork, setAddingNetwork] = useState(false);

  useEffect(() => {
    fetch("/api/info").then(r => r.json()).then(setInfo).catch(() => {});
  }, []);

  useEffect(() => {
    if (!status?.nextClaimAt) return;
    const tick = () => {
      const ms = status.nextClaimAt - Date.now();
      if (ms <= 0) { setCountdown(""); setStatus({ canClaim: true, nextClaimAt: null }); }
      else setCountdown(formatCountdown(ms));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [status?.nextClaimAt]);

  const checkStatus = async (addr) => {
    if (!addr || !/^0x[0-9a-fA-F]{40}$/.test(addr)) return;
    try {
      const r = await fetch(`/api/status/${addr}`);
      setStatus(await r.json());
    } catch {}
  };

  const handleAddressChange = (e) => {
    const val = e.target.value;
    setAddress(val);
    setResult(null);
    setStatus(null);
    if (/^0x[0-9a-fA-F]{40}$/.test(val)) checkStatus(val);
  };

  const handleRequest = async () => {
    if (!address) return;
    setLoading(true);
    setResult(null);
    try {
      const r = await fetch("/api/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
      });
      const d = await r.json();
      if (r.ok) {
        setResult({ ok: true, txHash: d.txHash });
        setStatus({ canClaim: false, nextClaimAt: Date.now() + 24 * 3600 * 1000 });
      } else {
        setResult({ error: d.error, nextClaimAt: d.nextClaimAt });
        if (d.nextClaimAt) setStatus({ canClaim: false, nextClaimAt: d.nextClaimAt });
      }
    } catch { setResult({ error: "Network error" }); }
    setLoading(false);
  };

  const handleAddNetwork = async () => {
    if (!window.ethereum || !info) return;
    setAddingNetwork(true);
    try {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [{
          chainId: "0x" + info.chainId.toString(16),
          chainName: info.networkName,
          nativeCurrency: { name: info.symbol, symbol: info.symbol, decimals: 18 },
          rpcUrls: [info.rpcUrl],
          blockExplorerUrls: [info.explorerUrl],
        }],
      });
    } catch (e) { console.error(e); }
    setAddingNetwork(false);
  };

  const canSubmit = /^0x[0-9a-fA-F]{40}$/.test(address) && !loading && (status === null || status.canClaim);

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ background: "#0C101B" }}>
      {/* Grid */}
      <div className="absolute inset-0 grid-bg pointer-events-none" />

      {/* Orbs */}
      <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(66,122,181,0.15) 0%, transparent 70%)" }} />
      <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(64,106,175,0.1) 0%, transparent 70%)" }} />

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-[420px]">

          {/* ── Header ─────────────────────────────────── */}
          <div className="fade-up text-center mb-8">
            <div className="inline-flex flex-col items-center gap-4">
              <div className="rounded-2xl border border-blue-DEFAULT/30 bg-blue-DEFAULT/10 p-3 glow-blue">
                <KarkasLogo size={44} />
              </div>
              <div>
                <h1 className="font-display text-2xl font-bold text-white">
                  {info?.networkName || "KARKAS"} Faucet
                </h1>
                <p className="text-sm text-white/50 mt-1">
                  Receive {info?.amountEth || "1"} {info?.symbol || "KRKS"} per 24 hours
                </p>
              </div>
            </div>
          </div>

          {/* ── Card ───────────────────────────────────── */}
          <div className="fade-up-2 rounded-3xl border border-white/8 bg-white/3 backdrop-blur-sm p-6">

            {/* Chain badge */}
            {info && (
              <div className="flex items-center justify-between mb-5 rounded-xl border border-blue-DEFAULT/20 bg-blue-DEFAULT/8 px-4 py-2.5">
                <span className="text-xs text-white/45 uppercase tracking-wider">Chain ID</span>
                <span className="font-mono text-xs text-blue-DEFAULT font-medium">{info.chainId}</span>
              </div>
            )}

            {/* Address input */}
            <div className="mb-4">
              <label className="block text-xs font-medium uppercase tracking-wider text-white/45 mb-2">
                Wallet Address
              </label>
              <input
                type="text"
                value={address}
                onChange={handleAddressChange}
                placeholder="0x…"
                className="input-field"
              />
            </div>

            {/* Status */}
            {status && address && (
              <div className={`mb-4 flex items-center gap-3 rounded-xl px-4 py-3 text-sm ${
                status.canClaim
                  ? "border border-emerald-500/25 bg-emerald-500/8 text-emerald-400"
                  : "border border-amber-500/25 bg-amber-500/8 text-amber-400"
              }`}>
                <div className={`w-2 h-2 rounded-full shrink-0 ${status.canClaim ? "bg-emerald-400" : "bg-amber-400"}`} />
                <span>
                  {status.canClaim
                    ? "Address eligible to claim"
                    : `Next claim in ${countdown}`}
                </span>
              </div>
            )}

            {/* CTA */}
            <button onClick={handleRequest} disabled={!canSubmit} className="btn-primary mb-3">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Sending…
                </span>
              ) : (
                `Request ${info?.amountEth || "1"} ${info?.symbol || "KRKS"}`
              )}
            </button>

            {/* MetaMask */}
            {info && (
              <button onClick={handleAddNetwork} disabled={addingNetwork || !window.ethereum} className="btn-metamask">
                <svg className="w-4 h-4" viewBox="0 0 35 33" fill="none">
                  <path d="M32.9582 1L19.8241 10.7183L22.2665 5.09986L32.9582 1Z" fill="#E17726"/>
                  <path d="M2.04858 1L15.0707 10.809L12.7423 5.09986L2.04858 1Z" fill="#E27625"/>
                  <path d="M28.2292 23.5334L24.7346 28.872L32.2111 30.9324L34.3873 23.6501L28.2292 23.5334Z" fill="#E27625"/>
                  <path d="M0.627319 23.6501L2.79061 30.9324L10.2542 28.872L6.77262 23.5334L0.627319 23.6501Z" fill="#E27625"/>
                </svg>
                {window.ethereum ? "Add Network to MetaMask" : "MetaMask not detected"}
              </button>
            )}

            {/* Result */}
            {result && (
              <div className={`mt-4 rounded-xl px-4 py-3 text-sm ${
                result.ok
                  ? "border border-emerald-500/25 bg-emerald-500/8 text-emerald-400"
                  : "border border-red-500/25 bg-red-500/8 text-red-400"
              }`}>
                {result.ok ? (
                  <div>
                    <p className="font-semibold mb-1">Tokens sent successfully!</p>
                    <a
                      href={`${info?.explorerUrl || ""}/tx/${result.txHash}`}
                      target="_blank" rel="noopener noreferrer"
                      className="text-xs underline opacity-70 hover:opacity-100 break-all font-mono">
                      {result.txHash}
                    </a>
                  </div>
                ) : (
                  <p>{result.error}</p>
                )}
              </div>
            )}
          </div>

          {/* ── Footer links ───────────────────────────── */}
          <div className="fade-up-3 mt-4 grid grid-cols-2 gap-3">
            <a
              href={info?.explorerUrl || "https://explorer.marakyja.xyz"}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-xl
                border border-white/8 bg-white/3 py-3 text-xs text-white/45
                hover:text-white/70 hover:border-blue-DEFAULT/30 transition-all duration-200">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
              </svg>
              Explorer
            </a>
            <div className="flex items-center justify-center gap-2 rounded-xl
              border border-white/8 bg-white/3 py-3 text-xs text-white/45">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              {info?.amountEth || "1"} {info?.symbol || "KRKS"} / 24h
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
