const NETWORK = {
  name: "KARKAS",
  chainId: 144411,
  symbol: "KRKS",
  rpcUrl: "https://rpc.marakyja.xyz",
  explorerUrl: "https://explorer.marakyja.xyz",
  faucetUrl: "https://faucet.marakyja.xyz",
};

/* ── Brand Logo (SVG) ─────────────────────────────────── */
function KarkasLogo({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="14" stroke="#427AB5" strokeWidth="1.5" fill="none"/>
      <circle cx="32" cy="32" r="4" fill="#427AB5"/>
      {/* 4 circle nodes */}
      <circle cx="32" cy="8"  r="3.5" fill="#5B9BD5" opacity="0.9"/>
      <circle cx="32" cy="56" r="3.5" fill="#5B9BD5" opacity="0.9"/>
      <circle cx="8"  cy="32" r="3.5" fill="#5B9BD5" opacity="0.9"/>
      <circle cx="56" cy="32" r="3.5" fill="#5B9BD5" opacity="0.9"/>
      {/* 4 diamond nodes */}
      {[[18,18],[46,18],[18,46],[46,46]].map(([x,y],i) => (
        <polygon key={i} points={`${x},${y-5} ${x+5},${y} ${x},${y+5} ${x-5},${y}`} fill="#F7DD7D" opacity="0.85"/>
      ))}
      {/* connector lines */}
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

/* ── Stat Card ─────────────────────────────────────────── */
function StatCard({ label, value, mono }) {
  return (
    <div className="card-hover rounded-2xl border border-white/8 bg-white/3 backdrop-blur-sm px-6 py-5">
      <p className="text-xs font-medium uppercase tracking-widest text-blue-DEFAULT/70 mb-2">{label}</p>
      <p className={`text-lg font-semibold text-white/90 break-all ${mono ? "font-mono text-sm" : ""}`}>{value}</p>
    </div>
  );
}

/* ── Feature Card ──────────────────────────────────────── */
function FeatureCard({ icon, title, body, delay }) {
  return (
    <div className={`card-hover fade-up-3 rounded-2xl border border-white/8 bg-white/3 backdrop-blur-sm p-6`} style={{ animationDelay: `${delay}s` }}>
      <div className="w-10 h-10 rounded-xl bg-blue-DEFAULT/15 border border-blue-DEFAULT/25 flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="font-display text-base font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm text-white/60 leading-relaxed">{body}</p>
    </div>
  );
}

/* ── Main App ──────────────────────────────────────────── */
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
      {/* Grid background */}
      <div className="absolute inset-0 grid-bg opacity-100 pointer-events-none" />

      {/* Ambient orbs */}
      <div className="absolute top-[-15%] right-[-10%] w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(66,122,181,0.18) 0%, transparent 70%)" }} />
      <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(64,106,175,0.12) 0%, transparent 70%)" }} />
      <div className="absolute top-[40%] left-[60%] w-[300px] h-[300px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(247,221,125,0.06) 0%, transparent 70%)" }} />

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
                hover:bg-gold-light transition-all duration-200 glow-gold">
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
                  hover:bg-gold-DEFAULT/10 transition-all duration-200">
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
                { label: "RPC URL",    val: NETWORK.rpcUrl },
                { label: "Explorer",   val: NETWORK.explorerUrl },
                { label: "Faucet",     val: NETWORK.faucetUrl },
                { label: "Chain ID",   val: NETWORK.chainId },
              ].map(({ label, val }) => (
                <div key={label} className="flex items-center justify-between gap-4">
                  <span className="text-xs text-white/45 uppercase tracking-wider shrink-0">{label}</span>
                  <span className="text-xs font-mono text-white/75 text-right truncate">{val}</span>
                </div>
              ))}
            </div>

            <div className="section-line mt-6 mb-5" />

            <button onClick={handleAddNetwork}
              className="w-full flex items-center justify-center gap-2 rounded-xl
                border border-gold-DEFAULT/35 bg-gold-DEFAULT/8 py-3
                text-sm font-display font-semibold text-gold-DEFAULT
                hover:bg-gold-DEFAULT/15 transition-all duration-200">
              <svg className="w-4 h-4" viewBox="0 0 35 33" fill="none">
                <path d="M32.9582 1L19.8241 10.7183L22.2665 5.09986L32.9582 1Z" fill="#E17726"/>
                <path d="M2.04858 1L15.0707 10.809L12.7423 5.09986L2.04858 1Z" fill="#E27625"/>
                <path d="M28.2292 23.5334L24.7346 28.872L32.2111 30.9324L34.3873 23.6501L28.2292 23.5334Z" fill="#E27625"/>
                <path d="M0.627319 23.6501L2.79061 30.9324L10.2542 28.872L6.77262 23.5334L0.627319 23.6501Z" fill="#E27625"/>
              </svg>
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
          <StatCard label="Chain ID"    value={NETWORK.chainId} />
          <StatCard label="Symbol"      value={NETWORK.symbol} />
          <StatCard label="Decimals"    value="18" />
          <StatCard label="Faucet/day"  value="1 KRKS" />
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
