const NETWORK = {
  name: "KARKAS",
  chainId: 144411,
  symbol: "KRKS",
  rpcUrl: "https://rpc.marakyja.xyz",
  explorerUrl: "https://explorer.marakyja.xyz",
  faucetUrl: "https://faucet.marakyja.xyz",
};

export default function App() {
  const handleAddNetwork = async () => {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: "0x" + NETWORK.chainId.toString(16),
            chainName: NETWORK.name,
            nativeCurrency: {
              name: NETWORK.name,
              symbol: NETWORK.symbol,
              decimals: 18,
            },
            rpcUrls: [NETWORK.rpcUrl],
            blockExplorerUrls: [NETWORK.explorerUrl],
          },
        ],
      });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 grid-sheen opacity-60" />
      <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-ember/30 blur-3xl float" />
      <div className="absolute bottom-0 left-[-10%] h-72 w-72 rounded-full bg-copper/20 blur-3xl float" />

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-16 px-6 py-10">
        <header className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between fade-up">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-ember/20 border border-ember/40 flex items-center justify-center shadow-glow">
              <span className="font-mono text-sm text-ember">KRKS</span>
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.4em] text-copper/80">L1 Network</p>
              <h1 className="text-2xl font-semibold">KARKAS</h1>
            </div>
          </div>
          <nav className="flex flex-wrap gap-3 text-sm">
            <a className="rounded-full border border-white/10 px-4 py-2 text-white/80 hover:text-white hover:border-white/30 transition" href={NETWORK.explorerUrl}>
              Explorer
            </a>
            <a className="rounded-full border border-white/10 px-4 py-2 text-white/80 hover:text-white hover:border-white/30 transition" href={NETWORK.faucetUrl}>
              Faucet
            </a>
            <a className="rounded-full border border-white/10 px-4 py-2 text-white/80 hover:text-white hover:border-white/30 transition" href={NETWORK.rpcUrl}>
              RPC
            </a>
          </nav>
        </header>

        <section className="grid gap-8 md:grid-cols-[1.1fr_0.9fr] items-center">
          <div className="space-y-6 fade-up">
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-white/60">Chain ID {NETWORK.chainId}</p>
            <h2 className="text-4xl md:text-5xl font-semibold leading-tight">
              Built for rapid iteration and resilient validation.
            </h2>
            <p className="text-lg text-white/70">
              KARKAS is a focused L1 testnet for shipping fast, testing new ideas,
              and moving value with confidence. Spin up RPC access, grab KRKS,
              and explore blocks in minutes.
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href={NETWORK.faucetUrl}
                className="rounded-full bg-ember px-5 py-2.5 text-sm font-semibold text-ink shadow-glow hover:bg-[#ff835e] transition"
              >
                Get KRKS
              </a>
              <button
                onClick={handleAddNetwork}
                className="rounded-full border border-ember/60 px-5 py-2.5 text-sm font-semibold text-ember hover:bg-ember/10 transition"
              >
                Add to MetaMask
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur fade-up-delay">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-white/50">Native Token</p>
                <p className="text-2xl font-semibold mt-2">{NETWORK.symbol}</p>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-ember/20 border border-ember/30 flex items-center justify-center">
                <span className="font-mono text-ember">KRKS</span>
              </div>
            </div>
            <div className="mt-6 space-y-4 text-sm">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span className="text-white/60">RPC URL</span>
                <span className="font-mono text-xs text-white/80">{NETWORK.rpcUrl}</span>
              </div>
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span className="text-white/60">Explorer</span>
                <span className="font-mono text-xs text-white/80">{NETWORK.explorerUrl}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/60">Faucet</span>
                <span className="font-mono text-xs text-white/80">{NETWORK.faucetUrl}</span>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-3 fade-up-delay">
          {[
            {
              title: "Fast Onboarding",
              body: "Single-command genesis + validator setup with auto-generated secrets.",
            },
            {
              title: "Clear Observability",
              body: "Blockscout + faucet + RPC endpoints with clean routing.",
            },
            {
              title: "Developer Velocity",
              body: "Ship contracts, test UX, and iterate without friction.",
            },
          ].map((card) => (
            <div
              key={card.title}
              className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur transition hover:border-white/30"
            >
              <h3 className="text-lg font-semibold">{card.title}</h3>
              <p className="mt-2 text-sm text-white/70">{card.body}</p>
            </div>
          ))}
        </section>

        <footer className="flex flex-col gap-2 text-xs text-white/50">
          <div className="font-mono">Chain ID {NETWORK.chainId} · Symbol {NETWORK.symbol}</div>
          <div>Run the faucet, explorer, and RPC from your KARKAS stack.</div>
        </footer>
      </div>
    </div>
  );
}
