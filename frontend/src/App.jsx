import AddToMetaMask from "./components/AddToMetaMask.jsx";
import NetworkInfo from "./components/NetworkInfo.jsx";
import { NETWORK } from "./config.js";

function IconExternal() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  );
}

function IconCube() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
    </svg>
  );
}

function IconDroplet() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c0 0-6 6.5-6 11a6 6 0 0012 0C18 9.5 12 3 12 3z" />
    </svg>
  );
}

function IconRpc() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-dark-500/40">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <span className="font-display font-bold text-white text-lg tracking-tight">
          KARKAS <span className="text-brand-400">·</span> Testnet
        </span>
        <div className="flex items-center gap-3">
          <a href={NETWORK.explorerUrl} target="_blank" rel="noopener noreferrer"
             className="text-sm text-slate-400 hover:text-white transition-colors font-body hidden sm:block">
            Explorer
          </a>
          <a href={NETWORK.faucetUrl} target="_blank" rel="noopener noreferrer"
             className="text-sm text-slate-400 hover:text-white transition-colors font-body hidden sm:block">
            Faucet
          </a>
          <AddToMetaMask className="scale-90 origin-right" />
        </div>
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <section className="relative pt-24 pb-16 px-4 text-center overflow-hidden">
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[420px] rounded-full bg-brand-500/10 blur-[120px]" />
        <div className="absolute top-40 right-1/4 w-64 h-64 rounded-full bg-indigo-500/6 blur-[80px]" />
      </div>

      <div className="inline-flex items-center gap-2 badge bg-brand-500/10 border border-brand-500/30 text-brand-400 mb-6 animate-fade-in">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        Testnet Live · Chain ID {NETWORK.chainId}
      </div>

      <h1 className="font-display font-extrabold text-5xl md:text-7xl text-white leading-tight mb-4 animate-slide-up">
        KARKAS
        <br />
        <span className="text-brand-400">Testnet</span>
      </h1>

      <p className="text-slate-400 text-lg md:text-xl max-w-xl mx-auto mb-3 animate-fade-in font-body leading-relaxed">
        PoS EVM testnet powered by Geth&nbsp;+&nbsp;Lighthouse.
        Build and deploy smart contracts with zero risk.
      </p>

      <p className="text-brand-400/80 font-mono text-sm mb-10 animate-fade-in">
        Token: <strong className="text-brand-300">KRKS</strong> &nbsp;·&nbsp; Faucet: <strong className="text-brand-300">1,000,000,000 KRKS</strong> per request
      </p>

      <div className="flex flex-wrap justify-center gap-4 animate-fade-in">
        <AddToMetaMask />
        <a href={NETWORK.explorerUrl} target="_blank" rel="noopener noreferrer" className="btn-outline flex items-center gap-2">
          Explorer <IconExternal />
        </a>
        <a href={NETWORK.faucetUrl} target="_blank" rel="noopener noreferrer" className="btn-outline flex items-center gap-2">
          Get KRKS <IconExternal />
        </a>
      </div>
    </section>
  );
}

function StepCard({ number, title, children }) {
  return (
    <div className="card flex gap-4">
      <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center font-display font-bold text-brand-400 text-sm">
        {number}
      </div>
      <div>
        <h4 className="font-display font-semibold text-white mb-1">{title}</h4>
        <p className="text-sm text-slate-400 leading-relaxed">{children}</p>
      </div>
    </div>
  );
}

function HowToConnect() {
  return (
    <section className="py-16 px-4">
      <div className="max-w-2xl mx-auto">
        <h2 className="font-display font-bold text-3xl text-white text-center mb-2">
          Connect in 3 Steps
        </h2>
        <p className="text-slate-400 text-center mb-10 text-sm">
          One click adds all network parameters to MetaMask automatically.
        </p>
        <div className="flex flex-col gap-4">
          <StepCard number="1" title="Install MetaMask">
            Download{" "}
            <a href="https://metamask.io/download/" target="_blank" rel="noopener noreferrer" className="text-brand-400 hover:text-brand-300 underline">
              MetaMask
            </a>{" "}
            for Chrome, Firefox, Brave, or mobile.
          </StepCard>
          <StepCard number="2" title="Add Karkas Testnet">
            Click <strong className="text-white">"Add to MetaMask"</strong> — Chain ID {NETWORK.chainId}, RPC, Explorer all fill in automatically.
          </StepCard>
          <StepCard number="3" title="Get 1 Billion KRKS">
            Visit the{" "}
            <a href={NETWORK.faucetUrl} target="_blank" rel="noopener noreferrer" className="text-brand-400 hover:text-brand-300 underline">
              Karkas Faucet
            </a>
            {" "}and request 1,000,000,000 KRKS to your address.
          </StepCard>
        </div>
      </div>
    </section>
  );
}

function QuickLinks() {
  const links = [
    {
      icon: <IconCube />,
      label: "Block Explorer",
      desc: "Browse txs, blocks & contracts",
      href: NETWORK.explorerUrl,
      color: "text-indigo-400",
      bg: "bg-indigo-500/10 border-indigo-500/20",
    },
    {
      icon: <IconDroplet />,
      label: "Faucet",
      desc: "1,000,000,000 KRKS per request",
      href: NETWORK.faucetUrl,
      color: "text-cyan-400",
      bg: "bg-cyan-500/10 border-cyan-500/20",
    },
    {
      icon: <IconRpc />,
      label: "JSON-RPC",
      desc: NETWORK.rpcUrl,
      href: NETWORK.rpcUrl,
      color: "text-brand-400",
      bg: "bg-brand-500/10 border-brand-500/20",
    },
  ];

  return (
    <section className="py-10 px-4">
      <div className="max-w-3xl mx-auto grid sm:grid-cols-3 gap-4">
        {links.map((l) => (
          <a
            key={l.label}
            href={l.href}
            target="_blank"
            rel="noopener noreferrer"
            className={`card border ${l.bg} flex flex-col gap-3 hover:scale-[1.02] transition-transform duration-200 group`}
          >
            <div className={l.color}>{l.icon}</div>
            <div>
              <div className={`font-display font-semibold text-sm ${l.color} group-hover:underline`}>{l.label}</div>
              <div className="text-xs text-slate-500 mt-0.5 font-mono truncate">{l.desc}</div>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}

function NetworkSection() {
  return (
    <section className="py-10 px-4">
      <div className="max-w-lg mx-auto">
        <NetworkInfo />
        <div className="mt-4 text-center">
          <AddToMetaMask className="inline-flex" />
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-dark-500/40 py-8 px-4 text-center">
      <p className="text-xs text-slate-600 font-mono">
        Karkas Testnet · KRKS · Chain ID {NETWORK.chainId} · Geth + Lighthouse
      </p>
    </footer>
  );
}

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <QuickLinks />
        <HowToConnect />
        <NetworkSection />
      </main>
      <Footer />
    </div>
  );
}
