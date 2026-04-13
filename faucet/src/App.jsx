import { useState, useEffect } from "react";

const CHAIN_ID = 444114;
const EXPLORER_URL = "https://explorer.marakyja.xyz";
const RPC_URL = "https://rpc.marakyja.xyz";

function formatCountdown(ms) {
  if (ms <= 0) return "now";
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${h}h ${m}m ${s}s`;
}

export default function App() {
  const [info, setInfo] = useState(null);
  const [address, setAddress] = useState("");
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [countdown, setCountdown] = useState("");
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

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
    if (!/^0x[0-9a-fA-F]{40}$/.test(addr)) return;
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

  const addNetwork = async () => {
    if (!window.ethereum) return alert("Install MetaMask first");
    setAdding(true);
    try {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [{
          chainId: "0x" + CHAIN_ID.toString(16),
          chainName: "Karkas Testnet",
          nativeCurrency: { name: "Karkas", symbol: "KRKS", decimals: 18 },
          rpcUrls: [RPC_URL],
          blockExplorerUrls: [EXPLORER_URL],
        }],
      });
      setAdded(true);
    } catch (e) { console.error(e); }
    setAdding(false);
  };

  const canSubmit = /^0x[0-9a-fA-F]{40}$/.test(address) && !loading && (status === null || status.canClaim);

  return (
    <div className="app">
      <div className="bg-glow" />
      <div className="bg-grid" />

      {/* Header */}
      <header className="header">
        <a href="https://marakyja.xyz" className="header-logo">
          <span className="bracket">[</span>KARKAS<span className="bracket">]</span>
        </a>
        <a href={EXPLORER_URL} className="header-link" target="_blank" rel="noopener noreferrer">
          Explorer ↗
        </a>
      </header>

      <main className="main">
        {/* Title */}
        <div className="title-block">
          <div className="badge">Testnet Faucet</div>
          <h1 className="title">Get KRKS Tokens</h1>
          <p className="subtitle">
            Receive <strong>{info?.amountEth || "1"} KRKS</strong> once every 24 hours.<br />
            Chain ID: <strong>{CHAIN_ID}</strong>
          </p>
        </div>

        {/* Card */}
        <div className="card">
          <label className="field-label">Wallet Address</label>
          <input
            className="input"
            type="text"
            value={address}
            onChange={handleAddressChange}
            placeholder="0x..."
          />

          {/* Status */}
          {status && address && (
            <div className={`status-bar ${status.canClaim ? "status-bar--ok" : "status-bar--wait"}`}>
              <span className={`status-dot ${status.canClaim ? "status-dot--ok" : "status-dot--wait"}`} />
              {status.canClaim ? "Ready to claim" : `Next claim in ${countdown}`}
            </div>
          )}

          <button className="claim-btn" onClick={handleRequest} disabled={!canSubmit}>
            {loading ? (
              <span className="loading-row">
                <svg className="spin" width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4" strokeDashoffset="10"/>
                </svg>
                Sending…
              </span>
            ) : `Request ${info?.amountEth || "1"} KRKS`}
          </button>

          {/* Result */}
          {result && (
            <div className={`result ${result.ok ? "result--ok" : "result--err"}`}>
              {result.ok ? (
                <>
                  <div className="result-title">✓ Tokens sent!</div>
                  <a
                    href={`${EXPLORER_URL}/tx/${result.txHash}`}
                    target="_blank" rel="noopener noreferrer"
                    className="tx-link"
                  >
                    {result.txHash?.slice(0, 18)}…{result.txHash?.slice(-8)} ↗
                  </a>
                </>
              ) : (
                <div>{result.error}</div>
              )}
            </div>
          )}
        </div>

        {/* Add to MetaMask */}
        <button className="metamask-btn" onClick={addNetwork} disabled={adding || !window.ethereum}>
          <svg width="18" height="18" viewBox="0 0 35 33" fill="none">
            <path d="M32.9582 1L19.8241 10.7183L22.2665 5.09986L32.9582 1Z" fill="#E17726"/>
            <path d="M2.04858 1L15.0707 10.809L12.7423 5.09986L2.04858 1Z" fill="#E27625"/>
          </svg>
          {added ? "✓ Network Added!" : adding ? "Adding…" : window.ethereum ? "Add Karkas to MetaMask" : "MetaMask not detected"}
        </button>

        {/* Network info */}
        <div className="net-info">
          {[
            ["Network", "Karkas Testnet"],
            ["Chain ID", CHAIN_ID],
            ["Symbol", "KRKS"],
            ["RPC", RPC_URL],
          ].map(([k, v]) => (
            <div key={k} className="net-row">
              <span className="net-key">{k}</span>
              <span className="net-val">{v}</span>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
