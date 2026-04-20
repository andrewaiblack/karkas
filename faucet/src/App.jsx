import { useState, useEffect, useRef } from "react";

function formatCountdown(ms) {
  if (ms <= 0) return "now";
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${h}h ${m}m ${s}s`;
}

function ParticleCanvas() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let animId;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener("resize", resize);
    const COUNT = 40;
    const particles = Array.from({ length: COUNT }, () => ({
      x: Math.random() * window.innerWidth, y: Math.random() * window.innerHeight,
      r: Math.random() * 1.4 + 0.3, vx: (Math.random() - 0.5) * 0.15, vy: (Math.random() - 0.5) * 0.15,
      type: Math.random() > 0.72 ? 1 : 0, alpha: Math.random() * 0.45 + 0.12, pulse: Math.random() * Math.PI * 2,
    }));
    const LINK_DIST = 120;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const t = Date.now() * 0.001;
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < -20) p.x = canvas.width + 20; if (p.x > canvas.width + 20) p.x = -20;
        if (p.y < -20) p.y = canvas.height + 20; if (p.y > canvas.height + 20) p.y = -20;
      });
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i], b = particles[j];
          const dx = a.x - b.x, dy = a.y - b.y, dist = Math.sqrt(dx*dx + dy*dy);
          if (dist < LINK_DIST) {
            const fade = 1 - dist / LINK_DIST;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = (a.type===1&&b.type===1) ? `rgba(247,221,125,${fade*0.15})` : `rgba(66,122,181,${fade*0.2})`;
            ctx.lineWidth = 0.8; ctx.stroke();
          }
        }
      }
      particles.forEach(p => {
        const alpha = p.alpha * (0.7 + 0.3 * Math.sin(t * 1.2 + p.pulse));
        if (p.type === 1) {
          const s = p.r * 3.5; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(Math.PI/4);
          ctx.fillStyle = `rgba(247,221,125,${alpha*0.85})`; ctx.fillRect(-s/2,-s/2,s,s); ctx.restore();
        } else {
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r*(1+0.3*Math.sin(t+p.pulse)), 0, Math.PI*2);
          ctx.fillStyle = `rgba(91,155,213,${alpha})`; ctx.fill();
        }
      });
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={canvasRef} id="particle-canvas" />;
}

function MetaMaskIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 318.6 318.6" xmlns="http://www.w3.org/2000/svg">
      <polygon fill="#e2761b" stroke="#e2761b" strokeLinecap="round" strokeLinejoin="round" points="274.1,35.5 174.6,109.4 193,65.8"/>
      <polygon fill="#e4761b" stroke="#e4761b" strokeLinecap="round" strokeLinejoin="round" points="44.4,35.5 143.1,110.1 125.6,65.8"/>
      <polygon fill="#e4761b" stroke="#e4761b" strokeLinecap="round" strokeLinejoin="round" points="238.3,206.8 211.8,247.4 268.5,263 284.8,207.7"/>
      <polygon fill="#e4761b" stroke="#e4761b" strokeLinecap="round" strokeLinejoin="round" points="33.9,207.7 50.1,263 106.8,247.4 80.3,206.8"/>
      <polygon fill="#e4761b" stroke="#e4761b" strokeLinecap="round" strokeLinejoin="round" points="103.6,138.2 87.8,162.1 144.1,164.6 142.1,104.1"/>
      <polygon fill="#e4761b" stroke="#e4761b" strokeLinecap="round" strokeLinejoin="round" points="214.9,138.2 175.9,103.4 174.6,164.6 230.8,162.1"/>
      <polygon fill="#e4761b" stroke="#e4761b" strokeLinecap="round" strokeLinejoin="round" points="106.8,247.4 140.6,230.9 111.4,208.1"/>
      <polygon fill="#e4761b" stroke="#e4761b" strokeLinecap="round" strokeLinejoin="round" points="177.9,230.9 211.8,247.4 207.1,208.1"/>
      <polygon fill="#d7c1b3" stroke="#d7c1b3" strokeLinecap="round" strokeLinejoin="round" points="211.8,247.4 177.9,230.9 180.6,253 180.3,262.3"/>
      <polygon fill="#d7c1b3" stroke="#d7c1b3" strokeLinecap="round" strokeLinejoin="round" points="106.8,247.4 138.3,262.3 138.1,253 140.6,230.9"/>
      <polygon fill="#233447" stroke="#233447" strokeLinecap="round" strokeLinejoin="round" points="138.8,193.5 110.6,185.2 130.5,176.1"/>
      <polygon fill="#233447" stroke="#233447" strokeLinecap="round" strokeLinejoin="round" points="179.7,193.5 188,176.1 208,185.2"/>
      <polygon fill="#cd6116" stroke="#cd6116" strokeLinecap="round" strokeLinejoin="round" points="106.8,247.4 111.6,206.8 80.3,207.7"/>
      <polygon fill="#cd6116" stroke="#cd6116" strokeLinecap="round" strokeLinejoin="round" points="207,206.8 211.8,247.4 238.3,207.7"/>
      <polygon fill="#cd6116" stroke="#cd6116" strokeLinecap="round" strokeLinejoin="round" points="230.8,162.1 174.6,164.6 179.8,193.5 188.1,176.1 208.1,185.2"/>
      <polygon fill="#cd6116" stroke="#cd6116" strokeLinecap="round" strokeLinejoin="round" points="110.6,185.2 130.6,176.1 138.8,193.5 144.1,164.6 87.8,162.1"/>
      <polygon fill="#e4751f" stroke="#e4751f" strokeLinecap="round" strokeLinejoin="round" points="87.8,162.1 111.4,208.1 110.6,185.2"/>
      <polygon fill="#e4751f" stroke="#e4751f" strokeLinecap="round" strokeLinejoin="round" points="208.1,185.2 207.1,208.1 230.8,162.1"/>
      <polygon fill="#e4751f" stroke="#e4751f" strokeLinecap="round" strokeLinejoin="round" points="144.1,164.6 138.8,193.5 145.4,227.6 146.9,182.7"/>
      <polygon fill="#e4751f" stroke="#e4751f" strokeLinecap="round" strokeLinejoin="round" points="174.6,164.6 171.9,182.6 173.1,227.6 179.8,193.5"/>
      <polygon fill="#f6851b" stroke="#f6851b" strokeLinecap="round" strokeLinejoin="round" points="179.8,193.5 173.1,227.6 177.9,230.9 207.1,208.1 208.1,185.2"/>
      <polygon fill="#f6851b" stroke="#f6851b" strokeLinecap="round" strokeLinejoin="round" points="110.6,185.2 111.4,208.1 140.6,230.9 145.4,227.6 138.8,193.5"/>
      <polygon fill="#c0ad9e" stroke="#c0ad9e" strokeLinecap="round" strokeLinejoin="round" points="180.3,262.3 180.6,253 178.1,250.8 140.4,250.8 138.1,253 138.3,262.3 106.8,247.4 117.8,256.4 140.1,271.9 178.4,271.9 200.8,256.4 211.8,247.4"/>
      <polygon fill="#161616" stroke="#161616" strokeLinecap="round" strokeLinejoin="round" points="177.9,230.9 173.1,227.6 145.4,227.6 140.6,230.9 138.1,253 140.4,250.8 178.1,250.8 180.6,253"/>
      <polygon fill="#763d16" stroke="#763d16" strokeLinecap="round" strokeLinejoin="round" points="278.3,114.2 286.8,73.4 274.1,35.5 177.9,106.9 214.9,138.2 267.2,153.5 278.8,140 273.8,136.4 281.8,129.1 275.6,124.3 283.6,118.2"/>
      <polygon fill="#763d16" stroke="#763d16" strokeLinecap="round" strokeLinejoin="round" points="31.8,73.4 40.3,114.2 34.9,118.2 42.9,124.3 36.8,129.1 44.8,136.4 39.8,140 51.3,153.5 103.6,138.2 140.6,106.9 44.4,35.5"/>
      <polygon fill="#f6851b" stroke="#f6851b" strokeLinecap="round" strokeLinejoin="round" points="267.2,153.5 214.9,138.2 230.8,162.1 207.1,208.1 238.3,207.7 284.8,207.7"/>
      <polygon fill="#f6851b" stroke="#f6851b" strokeLinecap="round" strokeLinejoin="round" points="103.6,138.2 51.3,153.5 33.9,207.7 80.3,207.7 111.4,208.1 87.8,162.1"/>
      <polygon fill="#f6851b" stroke="#f6851b" strokeLinecap="round" strokeLinejoin="round" points="174.6,164.6 177.9,106.9 193.1,65.8 125.6,65.8 140.6,106.9 144.1,164.6 145.3,182.8 145.4,227.6 173.1,227.6 173.2,182.8"/>
    </svg>
  );
}

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
    setAddress(val); setResult(null); setStatus(null);
    if (/^0x[0-9a-fA-F]{40}$/.test(val)) checkStatus(val);
  };

  const handleRequest = async () => {
    if (!address) return;
    setLoading(true); setResult(null);
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
    <div className="relative min-h-screen overflow-hidden bg-navy noise">
      <div className="aurora-bg" />
      <ParticleCanvas />
      <div className="scanline" />

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-[420px]">

          {/* Header */}
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

          {/* Card */}
          <div className="fade-up-2 rounded-3xl border border-white/8 bg-white/3 backdrop-blur-sm p-6">

            {info && (
              <div className="flex items-center justify-between mb-5 rounded-xl border border-blue-DEFAULT/20 bg-blue-DEFAULT/8 px-4 py-2.5">
                <span className="text-xs text-white/45 uppercase tracking-wider">Chain ID</span>
                <span className="font-mono text-xs text-blue-DEFAULT font-medium">{info.chainId}</span>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-xs font-medium uppercase tracking-wider text-white/45 mb-2">
                Wallet Address
              </label>
              <input
                type="text"
                value={address}
                onChange={handleAddressChange}
                placeholder="0x…"
                className="w-full rounded-xl border border-white/10 bg-white/4 px-4 py-3
                  text-sm text-white placeholder-white/25 font-mono
                  focus:outline-none focus:border-blue-DEFAULT/50 focus:bg-white/6
                  transition-all duration-200"
              />
            </div>

            {status && address && (
              <div className={`mb-4 flex items-center gap-3 rounded-xl px-4 py-3 text-sm ${
                status.canClaim
                  ? "border border-emerald-500/25 bg-emerald-500/8 text-emerald-400"
                  : "border border-amber-500/25 bg-amber-500/8 text-amber-400"
              }`}>
                <div className={`w-2 h-2 rounded-full shrink-0 ${status.canClaim ? "bg-emerald-400" : "bg-amber-400"}`} />
                <span>
                  {status.canClaim ? "Address eligible to claim" : `Next claim in ${countdown}`}
                </span>
              </div>
            )}

            <button
              onClick={handleRequest}
              disabled={!canSubmit}
              className="w-full rounded-xl py-3 mb-3 text-sm font-display font-semibold
                bg-blue-DEFAULT text-white hover:bg-blue-deep
                disabled:opacity-40 disabled:cursor-not-allowed
                transition-all duration-200 glow-blue"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Sending…
                </span>
              ) : (
                `Request ${info?.amountEth || "1"} ${info?.symbol || "KRKS"}`
              )}
            </button>

            {info && (
              <button
                onClick={handleAddNetwork}
                disabled={addingNetwork || !window.ethereum}
                className="w-full flex items-center justify-center gap-2 rounded-xl py-3
                  border border-gold-DEFAULT/35 bg-gold-DEFAULT/8
                  text-sm font-display font-semibold text-gold-DEFAULT
                  hover:bg-gold-DEFAULT/15 disabled:opacity-40 disabled:cursor-not-allowed
                  transition-all duration-200"
              >
                <MetaMaskIcon size={18} />
                {window.ethereum ? "Add Network to MetaMask" : "MetaMask not detected"}
              </button>
            )}

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

          {/* Footer links */}
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
