import { useEffect, useRef } from "react";

const NETWORK = {
  name: "KARKAS",
  chainId: 144411,
  symbol: "KRKS",
  rpcUrl: "https://rpc.marakyja.xyz",
  explorerUrl: "https://explorer.marakyja.xyz",
  faucetUrl: "https://faucet.marakyja.xyz",
};

/* ── Particle canvas background ────────────────────────── */
function ParticleCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let animId;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const COUNT = 55;
    const particles = Array.from({ length: COUNT }, () => ({
      x:    Math.random() * window.innerWidth,
      y:    Math.random() * window.innerHeight,
      r:    Math.random() * 1.4 + 0.3,
      vx:   (Math.random() - 0.5) * 0.18,
      vy:   (Math.random() - 0.5) * 0.18,
      // 0 = blue node, 1 = gold diamond
      type: Math.random() > 0.72 ? 1 : 0,
      alpha: Math.random() * 0.5 + 0.15,
      pulse: Math.random() * Math.PI * 2,
    }));

    const LINK_DIST = 140;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const t = Date.now() * 0.001;

      // Update positions
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -20) p.x = canvas.width  + 20;
        if (p.x > canvas.width  + 20) p.x = -20;
        if (p.y < -20) p.y = canvas.height + 20;
        if (p.y > canvas.height + 20) p.y = -20;
      });

      // Draw links
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i], b = particles[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < LINK_DIST) {
            const fade = 1 - dist / LINK_DIST;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            // gold link if both are gold, else blue
            const isGold = a.type === 1 && b.type === 1;
            ctx.strokeStyle = isGold
              ? `rgba(247,221,125,${fade * 0.18})`
              : `rgba(66,122,181,${fade * 0.22})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      // Draw nodes
      particles.forEach(p => {
        const pulse = 0.7 + 0.3 * Math.sin(t * 1.2 + p.pulse);
        const alpha = p.alpha * pulse;

        if (p.type === 1) {
          // Gold diamond
          const s = p.r * 3.5;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(Math.PI / 4);
          ctx.fillStyle = `rgba(247,221,125,${alpha * 0.85})`;
          ctx.fillRect(-s / 2, -s / 2, s, s);
          ctx.restore();
        } else {
          // Blue circle
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r * (1 + 0.3 * Math.sin(t + p.pulse)), 0, Math.PI * 2);
          ctx.fillStyle = `rgba(91,155,213,${alpha})`;
          ctx.fill();
        }
      });

      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} id="particle-canvas" />;
}

/* ── MetaMask full SVG ──────────────────────────────────── */
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

/* ── Stat Card ──────────────────────────────────────────── */
function StatCard({ label, value, mono }) {
  return (
    <div className="card-hover rounded-2xl border border-white/8 bg-white/3 backdrop-blur-sm px-6 py-5">
      <p className="text-xs font-medium uppercase tracking-widest text-blue-DEFAULT/70 mb-2">{label}</p>
      <p className={`text-lg font-semibold text-white/90 break-all ${mono ? "font-mono text-sm" : ""}`}>{value}</p>
    </div>
  );
}

/* ── Feature Card ───────────────────────────────────────── */
function FeatureCard({ icon, title, body, delay }) {
  return (
    <div className="card-hover fade-up-3 rounded-2xl border border-white/8 bg-white/3 backdrop-blur-sm p-6" style={{ animationDelay: `${delay}s` }}>
      <div className="w-10 h-10 rounded-xl bg-blue-DEFAULT/15 border border-blue-DEFAULT/25 flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="font-display text-base font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm text-white/60 leading-relaxed">{body}</p>
    </div>
  );
}

/* ── Main App ───────────────────────────────────────────── */
export default function App() {
  const handleAddNetwork = async () => {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [{
          chainId: "0x" + NETWORK.chainId.toString(16),
          chainName: NETWORK.name,
          nativeCurrency: { name: NETWORK.name, symbol: NETWORK.symbol, decimals: 18 },
          rpcUrls: [NETWORK.rpcUrl],
          blockExplorerUrls: [NETWORK.explorerUrl],
        }],
      });
    } catch (err) { console.error(err); }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-navy noise">
      {/* Aurora + particles */}
      <div className="aurora-bg" />
      <ParticleCanvas />
      <div className="scanline" />

      <div className="relative z-10 mx-auto max-w-6xl px-6 py-10 flex flex-col gap-20">

        {/* ── Header ─────────────────────────────────────── */}
        <header className="fade-up flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="glow-blue rounded-xl border border-blue-DEFAULT/30 bg-blue-DEFAULT/10 p-2">
              <KarkasLogo size={36} />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.35em] text-blue-DEFAULT/70">L1 Network</p>
              <h1 className="font-display text-2xl font-bold tracking-tight text-white">KARKAS</h1>
            </div>
          </div>
          <nav className="flex flex-wrap items-center gap-1">
            {[
              { label: "Explorer", href: NETWORK.explorerUrl },
              { label: "Faucet",   href: NETWORK.faucetUrl },
              { label: "RPC",      href: NETWORK.rpcUrl },
            ].map(({ label, href }) => (
              <a key={label} href={href} target="_blank" rel="noopener noreferrer"
                className="nav-link px-4 py-2 text-sm text-white/70 hover:text-white rounded-full
                  border border-white/10 hover:border-blue-DEFAULT/40 transition-all duration-200">
                {label}
              </a>
            ))}
            <button onClick={handleAddNetwork}
              className="ml-2 px-4 py-2 text-sm font-semibold rounded-full
                bg-gold-DEFAULT text-navy font-display tracking-wide
                hover:bg-gold-light transition-all duration-200 glow-gold flex items-center gap-2">
              <MetaMaskIcon size={16} />
              + MetaMask
            </button>
          </nav>
        </header>

        {/* ── Hero ───────────────────────────────────────── */}
        <section className="grid gap-12 md:grid-cols-[1.15fr_0.85fr] items-center">
          <div className="space-y-7 fade-up-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-DEFAULT/30 bg-blue-DEFAULT/10 px-4 py-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-gold-DEFAULT animate-pulse" />
              <span className="text-xs font-medium tracking-widest uppercase text-blue-DEFAULT">Chain ID {NETWORK.chainId}</span>
            </div>

            <h2 className="font-display text-5xl md:text-6xl font-bold leading-[1.05] tracking-tight text-white">
              Built for rapid
              <br />
              <span style={{ color: "#F7DD7D" }}>iteration</span> and
              <br />
              resilient validation.
            </h2>

            <p className="text-lg text-white/60 leading-relaxed max-w-lg">
              KARKAS is a focused L1 testnet for shipping fast, testing new ideas,
              and moving value with confidence. Spin up RPC access, grab KRKS,
              and explore blocks in minutes.
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <a href={NETWORK.faucetUrl} target="_blank" rel="noopener noreferrer"
                className="rounded-full px-6 py-3 text-sm font-display font-semibold tracking-wide
                  bg-blue-DEFAULT text-white hover:bg-blue-deep
                  transition-all duration-200 glow-blue">
                Get KRKS →
              </a>
              <button onClick={handleAddNetwork}
                className="rounded-full px-6 py-3 text-sm font-display font-semibold tracking-wide
                  border border-gold-DEFAULT/50 text-gold-DEFAULT
                  hover:bg-gold-DEFAULT/10 transition-all duration-200 flex items-center gap-2">
                <MetaMaskIcon size={18} />
                Add to MetaMask
              </button>
            </div>
          </div>

          {/* Network info card */}
          <div className="fade-up-2 rounded-3xl border border-blue-DEFAULT/25 bg-white/3 backdrop-blur-sm p-7 glow-blue">
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="text-xs uppercase tracking-widest text-blue-DEFAULT/60 mb-1">Native Token</p>
                <p className="font-display text-3xl font-bold text-white">{NETWORK.symbol}</p>
              </div>
              <div className="rounded-2xl border border-gold-DEFAULT/30 bg-gold-DEFAULT/10 p-3">
                <KarkasLogo size={28} />
              </div>
            </div>

            <div className="section-line mb-6" />

            <div className="space-y-4">
              {[
                { label: "RPC URL",  val: NETWORK.rpcUrl },
                { label: "Explorer", val: NETWORK.explorerUrl },
                { label: "Faucet",   val: NETWORK.faucetUrl },
                { label: "Chain ID", val: NETWORK.chainId },
              ].map(({ label, val }) => (
                <div key={label} className="flex items-center justify-between gap-4">
                  <span className="text-xs text-white/45 uppercase tracking-wider shrink-0">{label}</span>
                  <span className="text-xs font-mono text-white/75 text-right truncate">{val}</span>
                </div>
              ))}
            </div>

            <div className="section-line mt-6 mb-5" />

            <button onClick={handleAddNetwork}
              className="w-full flex items-center justify-center gap-2.5 rounded-xl
                border border-gold-DEFAULT/35 bg-gold-DEFAULT/8 py-3
                text-sm font-display font-semibold text-gold-DEFAULT
                hover:bg-gold-DEFAULT/15 transition-all duration-200">
              <MetaMaskIcon size={20} />
              Add KARKAS to MetaMask
            </button>
          </div>
        </section>

        {/* ── Divider ──────────────────────────────────── */}
        <div className="section-line" />

        {/* ── Features ─────────────────────────────────── */}
        <section className="space-y-8 fade-up-3">
          <div className="flex items-center gap-3">
            <span className="w-5 h-px bg-gold-DEFAULT/60" />
            <p className="text-xs font-medium uppercase tracking-widest text-gold-DEFAULT/70">Why KARKAS</p>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            <FeatureCard delay={0.3}
              icon={<svg className="w-5 h-5 text-blue-DEFAULT" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>}
              title="Fast Onboarding"
              body="Single-command genesis + validator setup with auto-generated secrets. Zero friction from zero to block one."
            />
            <FeatureCard delay={0.4}
              icon={<svg className="w-5 h-5 text-blue-DEFAULT" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>}
              title="Clear Observability"
              body="Blockscout + faucet + RPC endpoints with clean routing and full block explorer visibility."
            />
            <FeatureCard delay={0.5}
              icon={<svg className="w-5 h-5 text-blue-DEFAULT" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/></svg>}
              title="Developer Velocity"
              body="Ship contracts, test UX, and iterate without friction. Built for teams that move fast and ship often."
            />
          </div>
        </section>

        {/* ── Stats bar ─────────────────────────────────── */}
        <section className="fade-up-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Chain ID"   value={NETWORK.chainId} />
          <StatCard label="Symbol"     value={NETWORK.symbol} />
          <StatCard label="Decimals"   value="18" />
          <StatCard label="Faucet/day" value="1 KRKS" />
        </section>

        {/* ── Footer ───────────────────────────────────── */}
        <footer className="fade-up-4 section-line pt-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <KarkasLogo size={24} />
            <span className="font-display text-sm font-semibold text-white/60">KARKAS Network</span>
          </div>
          <p className="text-xs text-white/35">
            Chain ID {NETWORK.chainId} · {NETWORK.symbol} · Run the faucet, explorer, and RPC from your KARKAS stack.
          </p>
        </footer>
      </div>
    </div>
  );
}
