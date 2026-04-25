// src/pages/DappsPage.jsx
import { Link } from "react-router-dom";
import { NETWORK } from "../config/network";

const DAPPS = [
  {
    emoji: "🎰", title: "KRKS Roulette", desc: "CS:GO-style case spin. Every roll is a real on-chain transaction. Win up to 10× your bet.",
    to: "/dapps/gembl", badge: "HOT", badgeCls: "bg-gold/10 border-gold/30 text-gold", live: true,
    stats: [{ label: "Min bet", val: "0.01 KRKS" }, { label: "Max win", val: "10×" }],
  },
  {
    emoji: "🎲", title: "Dice Roll", desc: "Pick a number, roll on-chain, win up to 6× via block hash randomness.", badge: "Soon",
    badgeCls: "bg-white/5 border-white/10 text-white/30", to: null,
    stats: [],
  },
  {
    emoji: "🃏", title: "Blackjack", desc: "Classic 21 against the house. Smart contract dealer, KRKS stakes.", badge: "Soon",
    badgeCls: "bg-white/5 border-white/10 text-white/30", to: null,
    stats: [],
  },
];

const DEFI = [
  {
    emoji: "🔄", title: "KRKS Swap", desc: "AMM DEX for swapping test tokens. Deploy liquidity pools and test swap logic.", badge: "Soon",
    badgeCls: "bg-white/5 border-white/10 text-white/30",
  },
  {
    emoji: "📊", title: "Liquidity Pools", desc: "Add liquidity, earn swap fees, test impermanent loss before mainnet.", badge: "Soon",
    badgeCls: "bg-white/5 border-white/10 text-white/30",
  },
  {
    emoji: "🌉", title: "Token Bridge", desc: "Cross-chain messaging test. Bridge KRKS across test environments.", badge: "Soon",
    badgeCls: "bg-white/5 border-white/10 text-white/30",
  },
];

function SectionLabel({ children }) {
  return (
    <div className="flex items-center gap-3 mb-7">
      <div className="w-6 h-px bg-gold/50" />
      <span className="text-[11px] tracking-[0.2em] uppercase text-gold/60 font-semibold">{children}</span>
    </div>
  );
}

function DAppCard({ emoji, title, desc, badge, badgeCls, to, stats = [], featured }) {
  const inner = (
    <div className={`
      group relative rounded-2xl border p-7 h-full flex flex-col gap-4
      backdrop-blur-sm transition-all duration-300 overflow-hidden
      ${featured
        ? "border-gold/20 bg-gold/[0.03] hover:border-gold/40 hover:-translate-y-1"
        : "border-white/7 bg-white/[0.025] hover:border-blue/35 hover:-translate-y-1"
      }
    `}>
      {/* Radial glow on hover */}
      <div className={`
        absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300
        ${featured
          ? "bg-[radial-gradient(ellipse_at_top_left,rgba(247,221,125,0.07)_0%,transparent_60%)]"
          : "bg-[radial-gradient(ellipse_at_top_left,rgba(66,122,181,0.07)_0%,transparent_60%)]"
        }
      `} />

      <div className="relative flex items-center justify-between">
        <div className={`
          w-12 h-12 rounded-[14px] flex items-center justify-center text-2xl
          border
          ${featured ? "border-gold/30 bg-gold/10" : "border-blue/30 bg-blue/10"}
        `}>
          {emoji}
        </div>
        <span className={`text-[10px] font-bold tracking-[0.15em] uppercase px-2.5 py-1 rounded-full border ${badgeCls}`}>
          {badge}
        </span>
      </div>

      <div className="relative flex-1">
        <h3 className="font-display font-bold text-lg text-white mb-2">{title}</h3>
        <p className="text-sm text-white/50 leading-relaxed">{desc}</p>
      </div>

      {stats.length > 0 && (
        <div className="relative flex gap-5">
          {stats.map((s) => (
            <div key={s.label} className="text-xs text-white/35">
              {s.label}: <span className="text-white/65 font-semibold">{s.val}</span>
            </div>
          ))}
        </div>
      )}

      <div className={`relative text-xs font-semibold tracking-wide transition-all duration-200
        ${to ? "text-white/35 group-hover:text-white/80" : "text-white/15"}
      `}>
        {to ? "Play now →" : "Coming soon →"}
      </div>
    </div>
  );

  if (to) return <Link to={to} className="block h-full">{inner}</Link>;
  return <div className="h-full cursor-default">{inner}</div>;
}

export default function DappsPage() {
  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto px-5 pb-24">

        {/* Hero */}
        <div className="text-center py-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-gold/30
                          bg-gold/8 px-4 py-1.5 mb-5 text-[11px] tracking-[0.2em]
                          uppercase text-gold">
            <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
            KARKAS Testnet · Chain ID {NETWORK.chainId}
          </div>
          <h1 className="font-display font-bold text-5xl md:text-6xl text-white mb-4 tracking-tight">
            DApp <span className="text-gold">Ecosystem</span>
          </h1>
          <p className="text-white/45 text-lg max-w-lg mx-auto leading-relaxed">
            Test, explore and build on KARKAS. All dapps use native KRKS tokens —
            real transactions, zero real value.
          </p>
        </div>

        {/* Games */}
        <div className="mb-14">
          <SectionLabel>Games &amp; Gambling</SectionLabel>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {DAPPS.map((d) => (
              <DAppCard key={d.title} {...d} featured={d.live} />
            ))}
          </div>
        </div>

        {/* DeFi */}
        <div className="mb-16">
          <SectionLabel>DeFi &amp; Swaps</SectionLabel>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {DEFI.map((d) => (
              <DAppCard key={d.title} {...d} />
            ))}
          </div>
        </div>

        {/* Faucet */}
        <div>
          <SectionLabel>Get Testnet Tokens</SectionLabel>
          <div className="rounded-2xl border border-blue/20 bg-white/[0.025] backdrop-blur-sm p-7
                          grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="font-display font-bold text-xl text-white mb-2">KRKS Faucet</h3>
              <p className="text-sm text-white/50 leading-relaxed mb-5">
                Request 1 KRKS every 24 hours to your wallet. Use it across all DApps,
                or send transactions to test your contracts.
              </p>
              <div className="flex gap-6 text-xs text-white/35">
                <span>Chain ID: <strong className="text-white/60">144411</strong></span>
                <span>Symbol: <strong className="text-white/60">KRKS</strong></span>
                <span>Amount: <strong className="text-white/60">1 / 24h</strong></span>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <a
                href={NETWORK.faucetUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl
                           bg-blue hover:bg-blue-deep text-white font-display font-bold
                           text-sm transition-all shadow-glow-blue"
              >
                💧 Get KRKS Tokens
              </a>
              <a
                href={NETWORK.explorerUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl
                           border border-gold/25 bg-gold/6 text-gold font-display font-bold
                           text-sm hover:bg-gold/12 transition-all"
              >
                🔍 View Explorer
              </a>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
