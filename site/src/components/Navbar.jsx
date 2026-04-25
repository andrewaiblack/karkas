// src/components/Navbar.jsx
import { Link, useLocation } from "react-router-dom";
import { useWallet } from "../hooks/useWallet";

const Logo = () => (
  <svg width="32" height="32" viewBox="0 0 64 64" fill="none">
    <circle cx="32" cy="32" r="14" stroke="#427AB5" strokeWidth="1.5" fill="none"/>
    <circle cx="32" cy="32" r="4" fill="#427AB5"/>
    <circle cx="32" cy="8" r="3.5" fill="#5B9BD5" opacity="0.9"/>
    <circle cx="32" cy="56" r="3.5" fill="#5B9BD5" opacity="0.9"/>
    <circle cx="8" cy="32" r="3.5" fill="#5B9BD5" opacity="0.9"/>
    <circle cx="56" cy="32" r="3.5" fill="#5B9BD5" opacity="0.9"/>
    <polygon points="18,13 23,18 18,23 13,18" fill="#F7DD7D" opacity="0.85"/>
    <polygon points="46,13 51,18 46,23 41,18" fill="#F7DD7D" opacity="0.85"/>
    <polygon points="18,41 23,46 18,51 13,46" fill="#F7DD7D" opacity="0.85"/>
    <polygon points="46,41 51,46 46,51 41,46" fill="#F7DD7D" opacity="0.85"/>
  </svg>
);

export default function Navbar({ wallet }) {
  const { pathname } = useLocation();
  const { address, balanceEth, connect, connecting, isCorrectChain, switchToKarkas } = wallet;

  const links = [
    { to: "/",       label: "Home"     },
    { to: "/dapps",  label: "DApps"   },
    { href: "https://explorer.marakyja.xyz", label: "Explorer" },
    { href: "https://faucet.marakyja.xyz",   label: "Faucet"   },
  ];

  const isActive = (to) => {
    if (to === "/") return pathname === "/";
    return pathname.startsWith(to);
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-white/5 bg-navy/80 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-5 flex items-center justify-between h-16 gap-4">

        {/* Brand */}
        <Link to="/" className="flex items-center gap-2.5 shrink-0">
          <div className="p-1.5 rounded-xl border border-blue/30 bg-blue/10">
            <Logo />
          </div>
          <div className="hidden sm:block">
            <div className="text-[10px] tracking-[0.2em] uppercase text-blue/70 leading-none">L1 Network</div>
            <div className="font-display font-bold text-lg text-white leading-tight">KARKAS</div>
          </div>
        </Link>

        {/* Links */}
        <div className="hidden md:flex items-center gap-1">
          {links.map((l) =>
            l.href ? (
              <a
                key={l.href}
                href={l.href}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-1.5 rounded-full text-sm text-white/50 hover:text-white
                           border border-transparent hover:border-white/10 transition-all"
              >
                {l.label}
              </a>
            ) : (
              <Link
                key={l.to}
                to={l.to}
                className={`px-3.5 py-1.5 rounded-full text-sm transition-all border
                  ${isActive(l.to)
                    ? "text-gold border-gold/30 bg-gold/8"
                    : "text-white/50 border-transparent hover:text-white hover:border-white/10"
                  }`}
              >
                {l.label}
              </Link>
            )
          )}
        </div>

        {/* Wallet */}
        <div className="flex items-center gap-2 shrink-0">
          {address ? (
            <>
              {!isCorrectChain && (
                <button
                  onClick={switchToKarkas}
                  className="hidden sm:block px-3 py-1.5 rounded-full text-xs font-semibold
                             bg-red-500/10 border border-red-500/30 text-red-400
                             hover:bg-red-500/20 transition-all"
                >
                  Switch Network
                </button>
              )}
              {balanceEth !== null && (
                <div className="hidden sm:flex px-3 py-1.5 rounded-full text-xs font-bold
                                border border-gold/25 bg-gold/8 text-gold">
                  {balanceEth.toFixed(3)} KRKS
                </div>
              )}
              <div className="px-3 py-1.5 rounded-full text-xs font-mono
                              border border-blue/25 bg-blue/8 text-white/70">
                {address.slice(0,6)}…{address.slice(-4)}
              </div>
            </>
          ) : (
            <button
              onClick={connect}
              disabled={connecting}
              className="px-4 py-2 rounded-xl bg-blue hover:bg-blue-deep text-white text-sm
                         font-bold transition-all shadow-glow-blue disabled:opacity-50
                         font-display"
            >
              {connecting ? "Connecting…" : "Connect Wallet"}
            </button>
          )}
        </div>

      </div>
    </nav>
  );
}
