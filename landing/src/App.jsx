import { useState, useEffect, useRef } from "react";

const CHAIN_ID = 444114;
const RPC_URL = "https://rpc.marakyja.xyz";
const EXPLORER_URL = "https://explorer.marakyja.xyz";
const FAUCET_URL = "https://faucet.marakyja.xyz";

function useCounter(target, duration = 2000, start = false) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime = null;
    const step = (ts) => {
      if (!startTime) startTime = ts;
      const p = Math.min((ts - startTime) / duration, 1);
      setVal(Math.floor(p * target));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [start, target, duration]);
  return val;
}

function useInView(ref) {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold: 0.2 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return inView;
}

function Stat({ label, value, suffix = "", duration = 2000 }) {
  const ref = useRef(null);
  const inView = useInView(ref);
  const count = useCounter(value, duration, inView);
  return (
    <div ref={ref} className="stat-card">
      <div className="stat-value">{count.toLocaleString()}{suffix}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

const NAV_LINKS = ["About", "Roadmap", "Team", "Docs"];

const ROADMAP = [
  { phase: "01", title: "Genesis", status: "done", items: ["Mainnet launch", "Block explorer", "Faucet", "MetaMask integration"] },
  { phase: "02", title: "Ecosystem", status: "active", items: ["Smart contract IDE", "Token factory", "Bridge prototype", "Developer docs"] },
  { phase: "03", title: "Scale", status: "soon", items: ["EVM optimizations", "Sub-second finality", "Cross-chain messaging", "Grants program"] },
  { phase: "04", title: "Infinity", status: "future", items: ["Decentralized governance", "ZK rollup layer", "DeFi primitives", "Mobile wallet"] },
];

const TEAM = [
  { name: "andrwblck", role: "Founder & Core Dev", avatar: "A", color: "#ff6b35" },
  { name: "Open Role", role: "Protocol Engineer", avatar: "?", color: "#6366f1" },
  { name: "Open Role", role: "Frontend Engineer", avatar: "?", color: "#22d3ee" },
];

const DOCS = [
  { icon: "⚡", title: "Quick Start", desc: "Connect MetaMask and get testnet KRKS in 60 seconds.", href: FAUCET_URL },
  { icon: "🔗", title: "RPC Endpoint", desc: `Use ${RPC_URL} for all JSON-RPC calls. Chain ID: ${CHAIN_ID}.`, href: "#" },
  { icon: "🔍", title: "Block Explorer", desc: "Browse transactions, contracts, and addresses.", href: EXPLORER_URL },
  { icon: "📦", title: "Deploy Contracts", desc: "Use Remix IDE or Hardhat with our network config.", href: "#" },
];

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [addedNet, setAddedNet] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
      setAddedNet(true);
    } catch (e) { console.error(e); }
    setAdding(false);
  };

  return (
    <div className="app">
      {/* BG */}
      <div className="bg-mesh" />
      <div className="bg-grid" />

      {/* NAV */}
      <nav className={`nav ${scrolled ? "nav--scrolled" : ""}`}>
        <a href="/" className="nav-logo">
          <span className="logo-bracket">[</span>KARKAS<span className="logo-bracket">]</span>
        </a>
        <div className={`nav-links ${menuOpen ? "nav-links--open" : ""}`}>
          {NAV_LINKS.map(l => (
            <a key={l} href={`#${l.toLowerCase()}`} onClick={() => setMenuOpen(false)}>{l}</a>
          ))}
          <a href={FAUCET_URL} className="nav-faucet">Get KRKS →</a>
        </div>
        <button className="nav-burger" onClick={() => setMenuOpen(!menuOpen)}>
          <span /><span /><span />
        </button>
      </nav>

      {/* HERO */}
      <section className="hero" id="about">
        <div className="hero-badge">Testnet Live</div>
        <h1 className="hero-title">
          <span className="hero-title-line">Build on</span>
          <span className="hero-title-accent">Karkas</span>
        </h1>
        <p className="hero-sub">
          A high-performance EVM-compatible blockchain.<br />
          Native token <strong>KRKS</strong> · Chain ID <strong>{CHAIN_ID}</strong>
        </p>
        <div className="hero-actions">
          <button className="btn-primary" onClick={addNetwork} disabled={adding}>
            {adding ? "Adding…" : addedNet ? "✓ Added to MetaMask" : "Add to MetaMask"}
          </button>
          <a href={FAUCET_URL} className="btn-secondary">Get Testnet KRKS →</a>
        </div>
        <div className="hero-stats">
          <Stat label="Block Time" value={4} suffix="s" />
          <Stat label="Chain ID" value={CHAIN_ID} duration={1500} />
          <Stat label="Gas (Gwei)" value={1} suffix="" />
        </div>
        <div className="hero-scroll-hint">scroll</div>
      </section>

      {/* NETWORK INFO */}
      <section className="network-bar">
        <div className="network-bar-inner">
          {[
            ["RPC", RPC_URL],
            ["Chain ID", CHAIN_ID],
            ["Symbol", "KRKS"],
            ["Explorer", EXPLORER_URL],
          ].map(([k, v]) => (
            <div key={k} className="network-item">
              <span className="network-key">{k}</span>
              <span className="network-val">{v}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ROADMAP */}
      <section className="section" id="roadmap">
        <div className="section-label">/ roadmap</div>
        <h2 className="section-title">The Path Forward</h2>
        <div className="roadmap-grid">
          {ROADMAP.map((r) => (
            <div key={r.phase} className={`roadmap-card roadmap-card--${r.status}`}>
              <div className="roadmap-phase">{r.phase}</div>
              <div className="roadmap-status-dot" />
              <h3 className="roadmap-title">{r.title}</h3>
              <ul className="roadmap-items">
                {r.items.map(i => <li key={i}>{i}</li>)}
              </ul>
              <div className="roadmap-status-label">{r.status}</div>
            </div>
          ))}
        </div>
      </section>

      {/* TEAM */}
      <section className="section" id="team">
        <div className="section-label">/ team</div>
        <h2 className="section-title">Who Builds This</h2>
        <div className="team-grid">
          {TEAM.map((m) => (
            <div key={m.name} className="team-card">
              <div className="team-avatar" style={{ background: `${m.color}22`, border: `2px solid ${m.color}66`, color: m.color }}>
                {m.avatar}
              </div>
              <div className="team-name">{m.name}</div>
              <div className="team-role">{m.role}</div>
            </div>
          ))}
        </div>
      </section>

      {/* DOCS */}
      <section className="section" id="docs">
        <div className="section-label">/ docs</div>
        <h2 className="section-title">Start Building</h2>
        <div className="docs-grid">
          {DOCS.map((d) => (
            <a key={d.title} href={d.href} className="docs-card" target="_blank" rel="noopener noreferrer">
              <div className="docs-icon">{d.icon}</div>
              <div className="docs-title">{d.title}</div>
              <div className="docs-desc">{d.desc}</div>
              <div className="docs-arrow">→</div>
            </a>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="cta-glow" />
        <h2 className="cta-title">Ready to build?</h2>
        <p className="cta-sub">Get free KRKS tokens and start deploying contracts today.</p>
        <div className="hero-actions">
          <a href={FAUCET_URL} className="btn-primary">Launch Faucet →</a>
          <a href={EXPLORER_URL} className="btn-secondary">View Explorer</a>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-logo">
          <span className="logo-bracket">[</span>KARKAS<span className="logo-bracket">]</span>
        </div>
        <div className="footer-links">
          <a href={EXPLORER_URL}>Explorer</a>
          <a href={FAUCET_URL}>Faucet</a>
          <a href={`${RPC_URL}`}>RPC</a>
        </div>
        <div className="footer-copy">© 2026 Karkas Network · Chain ID {CHAIN_ID}</div>
      </footer>
    </div>
  );
}
