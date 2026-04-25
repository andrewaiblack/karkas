import { useEffect, useRef } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useWallet } from "./hooks/useWallet";
import Navbar from "./components/Navbar";
import DappsPage from "./pages/DappsPage";
import GemblPage from "./pages/GemblPage";

const NETWORK_CFG = {
  name: "KARKAS", chainId: 144411, symbol: "KRKS",
  rpcUrl: "https://rpc.marakyja.xyz",
  explorerUrl: "https://explorer.marakyja.xyz",
  faucetUrl: "https://faucet.marakyja.xyz",
};

function ParticleCanvas() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let animId;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize(); window.addEventListener("resize", resize);
    const COUNT = 55;
    const particles = Array.from({ length: COUNT }, () => ({
      x: Math.random() * window.innerWidth, y: Math.random() * window.innerHeight,
      r: Math.random() * 1.4 + 0.3, vx: (Math.random() - 0.5) * 0.18, vy: (Math.random() - 0.5) * 0.18,
      type: Math.random() > 0.72 ? 1 : 0, alpha: Math.random() * 0.5 + 0.15, pulse: Math.random() * Math.PI * 2,
    }));
    const LINK_DIST = 140;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const t = Date.now() * 0.001;
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < -20) p.x = canvas.width + 20; if (p.x > canvas.width + 20) p.x = -20;
        if (p.y < -20) p.y = canvas.height + 20; if (p.y > canvas.height + 20) p.y = -20;
      });
      for (let i = 0; i < particles.length; i++) for (let j = i + 1; j < particles.length; j++) {
        const a = particles[i], b = particles[j];
        const dx = a.x - b.x, dy = a.y - b.y, dist = Math.sqrt(dx*dx+dy*dy);
        if (dist < LINK_DIST) {
          const fade = 1 - dist / LINK_DIST;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = (a.type===1&&b.type===1) ? `rgba(247,221,125,${fade*0.18})` : `rgba(66,122,181,${fade*0.22})`;
          ctx.lineWidth = 0.8; ctx.stroke();
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
  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />;
}

function KarkasLogo({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <circle cx="32" cy="32" r="14" stroke="#427AB5" strokeWidth="1.5" fill="none"/>
      <circle cx="32" cy="32" r="4" fill="#427AB5"/>
      <circle cx="32" cy="8"  r="3.5" fill="#5B9BD5" opacity="0.9"/>
      <circle cx="32" cy="56" r="3.5" fill="#5B9BD5" opacity="0.9"/>
      <circle cx="8"  cy="32" r="3.5" fill="#5B9BD5" opacity="0.9"/>
      <circle cx="56" cy="32" r="3.5" fill="#5B9BD5" opacity="0.9"/>
      {[[18,18],[46,18],[18,46],[46,46]].map(([x,y],i)=>(
        <polygon key={i} points={`${x},${y-5} ${x+5},${y} ${x},${y+5} ${x-5},${y}`} fill="#F7DD7D" opacity="0.85"/>
      ))}
    </svg>
  );
}

function MetaMaskIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 318.6 318.6">
      <polygon fill="#e2761b" stroke="#e2761b" strokeLinecap="round" strokeLinejoin="round" points="274.1,35.5 174.6,109.4 193,65.8"/>
      <polygon fill="#e4761b" stroke="#e4761b" strokeLinecap="round" strokeLinejoin="round" points="44.4,35.5 143.1,110.1 125.6,65.8"/>
      <polygon fill="#e4761b" stroke="#e4761b" strokeLinecap="round" strokeLinejoin="round" points="238.3,206.8 211.8,247.4 268.5,263 284.8,207.7"/>
      <polygon fill="#e4761b" stroke="#e4761b" strokeLinecap="round" strokeLinejoin="round" points="33.9,207.7 50.1,263 106.8,247.4 80.3,206.8"/>
      <polygon fill="#f6851b" stroke="#f6851b" strokeLinecap="round" strokeLinejoin="round" points="267.2,153.5 214.9,138.2 230.8,162.1 207.1,208.1 238.3,207.7 284.8,207.7"/>
      <polygon fill="#f6851b" stroke="#f6851b" strokeLinecap="round" strokeLinejoin="round" points="103.6,138.2 51.3,153.5 33.9,207.7 80.3,207.7 111.4,208.1 87.8,162.1"/>
      <polygon fill="#f6851b" stroke="#f6851b" strokeLinecap="round" strokeLinejoin="round" points="174.6,164.6 177.9,106.9 193.1,65.8 125.6,65.8 140.6,106.9 144.1,164.6 145.3,182.8 145.4,227.6 173.1,227.6 173.2,182.8"/>
    </svg>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="card-hover rounded-2xl border border-white/8 bg-white/3 backdrop-blur-sm px-6 py-5">
      <p className="text-xs font-medium uppercase tracking-widest text-blue-DEFAULT/70 mb-2">{label}</p>
      <p className="text-lg font-semibold text-white/90 break-all">{value}</p>
    </div>
  );
}
function FeatureCard({ icon, title, body, delay }) {
  return (
    <div className="card-hover fade-up-3 rounded-2xl border border-white/8 bg-white/3 backdrop-blur-sm p-6" style={{ animationDelay: `${delay}s` }}>
      <div className="w-10 h-10 rounded-xl bg-blue-DEFAULT/15 border border-blue-DEFAULT/25 flex items-center justify-center mb-4">{icon}</div>
      <h3 className="font-display text-base font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm text-white/60 leading-relaxed">{body}</p>
    </div>
  );
}

function LandingPage() {
  const handleAddNetwork = async () => {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({ method: "wallet_addEthereumChain", params: [{ chainId: "0x" + NETWORK_CFG.chainId.toString(16), chainName: NETWORK_CFG.name, nativeCurrency: { name: NETWORK_CFG.name, symbol: NETWORK_CFG.symbol, decimals: 18 }, rpcUrls: [NETWORK_CFG.rpcUrl], blockExplorerUrls: [NETWORK_CFG.explorerUrl] }] });
    } catch (err) { console.error(err); }
  };
  return (
    <div className="relative z-10 mx-auto max-w-6xl px-6 py-10 flex flex-col gap-20">
      <header className="fade-up flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="glow-blue rounded-xl border border-blue-DEFAULT/30 bg-blue-DEFAULT/10 p-2"><KarkasLogo size={36}/></div>
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.35em] text-blue-DEFAULT/70">L1 Network</p>
            <h1 className="font-display text-2xl font-bold tracking-tight text-white">KARKAS</h1>
          </div>
        </div>
        <nav className="flex flex-wrap items-center gap-1">
          <a href={NETWORK_CFG.explorerUrl} target="_blank" rel="noopener noreferrer" className="nav-link px-4 py-2 text-sm text-white/70 hover:text-white rounded-full border border-white/10 hover:border-blue-DEFAULT/40 transition-all">Explorer</a>
          <a href={NETWORK_CFG.faucetUrl}   target="_blank" rel="noopener noreferrer" className="nav-link px-4 py-2 text-sm text-white/70 hover:text-white rounded-full border border-white/10 hover:border-blue-DEFAULT/40 transition-all">Faucet</a>
          <a href="/dapps" className="nav-link px-4 py-2 text-sm rounded-full border border-gold-DEFAULT/30 text-gold-DEFAULT hover:bg-gold-DEFAULT/10 transition-all">DApps →</a>
        </nav>
      </header>

      <section className="grid gap-12 md:grid-cols-[1.15fr_0.85fr] items-center">
        <div className="space-y-7 fade-up-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-DEFAULT/30 bg-blue-DEFAULT/10 px-4 py-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-gold-DEFAULT animate-pulse"/>
            <span className="text-xs font-medium tracking-widest uppercase text-blue-DEFAULT">Chain ID {NETWORK_CFG.chainId}</span>
          </div>
          <h2 className="font-display text-5xl md:text-6xl font-bold leading-[1.05] tracking-tight text-white">Built for rapid<br/><span style={{color:"#F7DD7D"}}>iteration</span> and<br/>resilient validation.</h2>
          <p className="text-lg text-white/60 leading-relaxed max-w-lg">KARKAS is a focused L1 testnet for shipping fast, testing new ideas, and moving value with confidence. Spin up RPC access, grab KRKS, and explore blocks in minutes.</p>
          <div className="flex flex-wrap gap-3 pt-2">
            <a href={NETWORK_CFG.faucetUrl} target="_blank" rel="noopener noreferrer" className="rounded-full px-6 py-3 text-sm font-display font-semibold bg-blue-DEFAULT text-white hover:bg-blue-deep transition-all glow-blue">Get KRKS →</a>
            <button onClick={handleAddNetwork} className="rounded-full px-6 py-3 text-sm font-display font-semibold border border-gold-DEFAULT/50 text-gold-DEFAULT hover:bg-gold-DEFAULT/10 transition-all flex items-center gap-2"><MetaMaskIcon size={18}/>Add to MetaMask</button>
          </div>
        </div>
        <div className="fade-up-2 rounded-3xl border border-blue-DEFAULT/25 bg-white/3 backdrop-blur-sm p-7 glow-blue">
          <div className="flex items-start justify-between mb-6">
            <div><p className="text-xs uppercase tracking-widest text-blue-DEFAULT/60 mb-1">Native Token</p><p className="font-display text-3xl font-bold text-white">{NETWORK_CFG.symbol}</p></div>
            <div className="rounded-2xl border border-gold-DEFAULT/30 bg-gold-DEFAULT/10 p-3"><KarkasLogo size={28}/></div>
          </div>
          <div className="section-line mb-6"/>
          <div className="space-y-4">
            {[{label:"RPC URL",val:NETWORK_CFG.rpcUrl},{label:"Explorer",val:NETWORK_CFG.explorerUrl},{label:"Faucet",val:NETWORK_CFG.faucetUrl},{label:"Chain ID",val:NETWORK_CFG.chainId}].map(({label,val})=>(
              <div key={label} className="flex items-center justify-between gap-4">
                <span className="text-xs text-white/45 uppercase tracking-wider shrink-0">{label}</span>
                <span className="text-xs font-mono text-white/75 text-right truncate">{val}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="section-line"/>

      <section className="space-y-8 fade-up-3">
        <div className="flex items-center gap-3"><span className="w-5 h-px bg-gold-DEFAULT/60"/><p className="text-xs font-medium uppercase tracking-widest text-gold-DEFAULT/70">Why KARKAS</p></div>
        <div className="grid gap-5 md:grid-cols-3">
          <FeatureCard delay={0.3} icon={<svg className="w-5 h-5 text-blue-DEFAULT" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>} title="Fast Onboarding" body="Single-command genesis + validator setup. Zero friction from zero to block one."/>
          <FeatureCard delay={0.4} icon={<svg className="w-5 h-5 text-blue-DEFAULT" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>} title="Clear Observability" body="Blockscout + faucet + RPC with clean routing and full block explorer visibility."/>
          <FeatureCard delay={0.5} icon={<svg className="w-5 h-5 text-blue-DEFAULT" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/></svg>} title="Developer Velocity" body="Ship contracts, test UX, and iterate without friction. Built for teams that move fast."/>
        </div>
      </section>

      <section className="fade-up-4 grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Chain ID" value={NETWORK_CFG.chainId}/>
        <StatCard label="Symbol" value={NETWORK_CFG.symbol}/>
        <StatCard label="Decimals" value="18"/>
        <StatCard label="Faucet/day" value="1 KRKS"/>
      </section>

      <footer className="fade-up-4 section-line pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3"><KarkasLogo size={24}/><span className="font-display text-sm font-semibold text-white/60">KARKAS Network</span></div>
        <p className="text-xs text-white/35 text-center md:text-right">Chain ID {NETWORK_CFG.chainId} · {NETWORK_CFG.symbol} · Testnet</p>
      </footer>
    </div>
  );
}

function Background() {
  const { pathname } = useLocation();
  return (
    <>
      <div className="aurora-bg"/>
      {pathname === "/" && <ParticleCanvas/>}
      <div className="scanline"/>
    </>
  );
}

function AppInner() {
  const wallet = useWallet();
  const { pathname } = useLocation();
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-navy noise">
      <Background/>
      {pathname !== "/" && <Navbar wallet={wallet}/>}
      <Routes>
        <Route path="/"            element={<LandingPage/>}/>
        <Route path="/dapps"       element={<DappsPage/>}/>
        <Route path="/dapps/gembl" element={<GemblPage wallet={wallet}/>}/>
        <Route path="*"            element={<LandingPage/>}/>
      </Routes>
    </div>
  );
}

export default function App() {
  return <BrowserRouter><AppInner/></BrowserRouter>;
}
