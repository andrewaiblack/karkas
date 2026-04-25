// src/pages/GemblPage.jsx
import { useState, useRef, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import RouletteReel from "../components/RouletteReel";
import { useRoulette } from "../hooks/useRoulette";
import { RARITY_INFO, NETWORK } from "../config/network";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function spawnConfetti() {
  const colors = ["#F7DD7D","#427AB5","#4ade80","#ce93d8","#fc8181","#60a5fa"];
  for (let i = 0; i < 36; i++) {
    const d = document.createElement("div");
    const s = 5 + Math.random() * 8;
    d.style.cssText = `position:fixed;width:${s}px;height:${s}px;border-radius:50%;
      pointer-events:none;z-index:9999;
      background:${colors[Math.floor(Math.random()*colors.length)]};
      left:${15+Math.random()*70}%;top:${5+Math.random()*30}%;
      animation:cfFall ${1.2+Math.random()*1.2}s ${Math.random()*0.3}s linear forwards;`;
    document.body.appendChild(d);
    setTimeout(() => d.remove(), 2800);
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Badge({ children, color = "blue" }) {
  const cls = {
    blue:   "border-blue/30   bg-blue/10   text-blue",
    gold:   "border-gold/30   bg-gold/10   text-gold",
    green:  "border-green-500/30 bg-green-500/10 text-green-400",
    red:    "border-red-500/30   bg-red-500/10   text-red-400",
    white:  "border-white/10  bg-white/5   text-white/40",
  }[color];
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full
                      text-[10px] font-bold tracking-[0.15em] uppercase border ${cls}`}>
      {children}
    </span>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div className="flex flex-col items-center gap-1 px-4">
      <div className={`font-display font-bold text-xl leading-none ${color || "text-white"}`}>
        {value}
      </div>
      <div className="text-[10px] tracking-[0.15em] uppercase text-white/30">{label}</div>
    </div>
  );
}

function Legend() {
  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.02] px-5 py-4">
      <div className="text-[10px] tracking-[0.2em] uppercase text-white/25 mb-3">Prizes &amp; Odds</div>
      <div className="flex flex-wrap gap-2">
        {RARITY_INFO.map(r => (
          <div key={r.id}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold"
            style={{ background: `${r.color}18`, border: `1px solid ${r.color}30`, color: r.color }}>
            <span className="text-sm">{r.emoji}</span>
            {r.name} · {r.prob} {r.mult > 0 ? `· ×${r.mult}` : "· miss"}
          </div>
        ))}
      </div>
    </div>
  );
}

function HistoryRow({ h, isNew }) {
  const info = RARITY_INFO[h.rarityId] || RARITY_INFO[0];
  const won  = h.payout > h.bet;
  const net  = won
    ? `+${(h.payout - h.bet).toFixed(3)} KRKS`
    : `-${h.bet.toFixed(3)} KRKS`;

  return (
    <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl
                     border border-white/[0.05] bg-white/[0.02] text-sm
                     ${isNew ? "animate-[slideUp_0.35s_ease]" : ""}`}>
      <span className="text-lg shrink-0">{info.emoji}</span>
      <span className="text-white/65 min-w-0 truncate flex-1">
        {info.label}
        {!h.isReal && <span className="ml-1.5 text-[10px] text-white/20">[demo]</span>}
        {h.refunded && <span className="ml-1.5 text-[10px] text-yellow-400/70">[refunded]</span>}
      </span>
      <span className="text-xs text-white/30 shrink-0">{h.bet.toFixed(2)} KRKS</span>
      <span className={`font-bold text-xs shrink-0 ${won ? "text-green-400" : "text-red-400"}`}>
        {net}
      </span>
      {h.txHash
        ? <a href={`${NETWORK.explorerUrl}/tx/${h.txHash}`} target="_blank" rel="noreferrer"
             className="font-mono text-[10px] text-blue/60 hover:text-blue shrink-0">
             {h.txHash.slice(0,8)}…
           </a>
        : <span className="text-[10px] text-white/15 shrink-0">demo</span>
      }
    </div>
  );
}

function Toast({ msg, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [msg, onClose]);

  const cls = {
    win:  "bg-green-950/95 border-green-500/30 text-green-300",
    lose: "bg-red-950/95   border-red-500/30   text-red-300",
    info: "bg-navy/95      border-white/10      text-white/80",
    warn: "bg-yellow-950/95 border-yellow-500/30 text-yellow-300",
    err:  "bg-red-950/95   border-red-500/30   text-red-300",
  }[type] || "bg-navy/95 border-white/10 text-white/80";

  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[9998]
                     px-5 py-3 rounded-xl text-sm font-semibold max-w-sm text-center
                     border backdrop-blur-xl shadow-xl
                     animate-[slideUp_0.25s_ease] ${cls}`}>
      {msg}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function GemblPage({ wallet }) {
  const { address, signer, provider, connect, connecting,
          isCorrectChain, switchToKarkas, refresh: refreshBalance } = wallet;

  const [bet,         setBet]       = useState("0.1");
  const [localHistory,setHistory]   = useState([]);
  const [newIdx,      setNewIdx]    = useState(null);
  const [stats,       setStats]     = useState({ spins:0, won:0, lost:0, pnl:0 });
  const [result,      setResult]    = useState(null);
  const [glow,        setGlow]      = useState(false);
  const [toast,       setToast]     = useState(null);
  const [demoRunning, setDemoRunning] = useState(false);

  const reelRef = useRef(null);

  const showToast = useCallback((msg, type = "info") =>
    setToast({ msg, type, key: Date.now() }), []);

  const {
    prizePool, minBet, maxBet, totalSpins,
    spinning, waiting, error, txHash, pendingId,
    isDeployed, spinReal, spinDemo, claimRefund, clearError,
  } = useRoulette(signer, provider, address);

  // Show contract errors
  useEffect(() => {
    if (error) showToast("❌ " + error, "err");
  }, [error, showToast]);

  // ── Add to history ────────────────────────────────────────────────────────

  const pushHistory = useCallback((rarityId, betAmt, payout, txHash, isReal, refunded = false) => {
    const entry = { rarityId, bet: betAmt, payout, txHash, isReal, refunded, id: Date.now() };
    setHistory(prev => [entry, ...prev].slice(0, 25));
    setNewIdx(0);
    setTimeout(() => setNewIdx(null), 600);
    setStats(prev => {
      const won = payout > betAmt;
      return {
        spins: prev.spins + 1,
        won:   prev.won  + (won ? 1 : 0),
        lost:  prev.lost + (won ? 0 : 1),
        pnl:   prev.pnl  + (payout - betAmt),
      };
    });
  }, []);

  // ── Reel animation then callback ──────────────────────────────────────────

  const animateThen = useCallback((outcome, cb) => {
    reelRef.current?.spin(outcome);
    setTimeout(() => {
      cb(outcome);
    }, 4800);
  }, []);

  // ── Real spin ─────────────────────────────────────────────────────────────

  const handleRealSpin = useCallback(async () => {
    const betAmt = parseFloat(bet);
    if (isNaN(betAmt) || betAmt <= 0) { showToast("Invalid bet amount", "err"); return; }

    clearError();
    setResult(null);
    setGlow(false);

    // requestSpin TX
    spinReal(betAmt, ({ outcome, payout, refunded }) => {
      // Oracle fulfilled — animate
      animateThen(outcome, () => {
        const won = payout > betAmt;
        setResult({ outcome, won, bet: betAmt, payout, refunded });
        pushHistory(outcome.id, betAmt, payout, txHash, true, refunded);
        refreshBalance?.();

        if (refunded) {
          showToast("⏱ Bet refunded — oracle timed out", "warn");
        } else if (won) {
          spawnConfetti(); setGlow(true);
          showToast(`🎉 ${outcome.emoji} ${outcome.label} — +${(payout - betAmt).toFixed(3)} KRKS!`, "win");
        } else {
          showToast(`💀 Miss — -${betAmt.toFixed(2)} KRKS`, "lose");
        }
      });
    });
  }, [bet, spinReal, animateThen, pushHistory, txHash, refreshBalance, showToast, clearError]);

  // ── Demo spin ─────────────────────────────────────────────────────────────

  const handleDemoSpin = useCallback(() => {
    if (spinning || waiting || demoRunning) return;
    const betAmt = parseFloat(bet) || 0.1;
    const outcome = spinDemo();
    setDemoRunning(true);
    setResult(null);
    setGlow(false);

    animateThen(outcome, () => {
      const payout = betAmt * outcome.mult;
      const won    = outcome.mult > 0;
      setResult({ outcome, won, bet: betAmt, payout, refunded: false });
      pushHistory(outcome.id, betAmt, payout, null, false);
      setDemoRunning(false);
      if (won) { spawnConfetti(); setGlow(true); showToast(`🎉 [DEMO] ${outcome.emoji} ${outcome.label}!`, "win"); }
      else      { showToast("[DEMO] Miss!", "lose"); }
    });
  }, [spinning, waiting, demoRunning, bet, spinDemo, animateThen, pushHistory, showToast]);

  // ── Bet controls ─────────────────────────────────────────────────────────

  const isSpinning = spinning || waiting || demoRunning;
  const pnlPos     = stats.pnl >= 0;

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-5 pb-28">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 pt-6 pb-5 text-sm text-white/30">
          <Link to="/dapps" className="hover:text-white/60 transition-colors">DApps</Link>
          <span>/</span>
          <span className="text-white/50">KRKS Roulette</span>
        </div>

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-8 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Badge color="gold">
                <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
                On-chain Gambling · KARKAS Testnet
              </Badge>
            </div>
            <h1 className="font-display font-bold text-5xl text-white tracking-tight">
              KRKS <span className="text-gold">Roulette</span>
            </h1>
            <p className="text-white/40 mt-2 text-sm">
              VRF Oracle · Provably fair · Every spin is a real transaction
            </p>
          </div>
          {isDeployed && prizePool !== null && (
            <div className="rounded-2xl border border-gold/20 bg-gold/[0.04] px-6 py-3 text-center">
              <div className="font-display font-bold text-2xl text-gold leading-none">
                {prizePool.toFixed(2)}
              </div>
              <div className="text-[10px] tracking-widest uppercase text-gold/50 mt-1">
                Prize Pool KRKS
              </div>
            </div>
          )}
        </div>

        {/* Contract warning */}
        {!isDeployed && (
          <div className="mb-6 rounded-xl border border-yellow-500/25 bg-yellow-500/5
                          px-5 py-3 flex gap-3 items-start">
            <span className="text-lg mt-0.5">⚠️</span>
            <div className="text-sm text-yellow-200/70 leading-relaxed">
              Contract not deployed. Use <strong className="text-yellow-200">Demo Spin</strong> to
              test the UI. Deploy the contract and update{" "}
              <code className="bg-white/5 px-1.5 py-0.5 rounded text-xs">ROULETTE_ADDRESS</code>{" "}
              in <code className="bg-white/5 px-1.5 py-0.5 rounded text-xs">src/config/network.js</code>.
            </div>
          </div>
        )}

        {/* Wallet banners */}
        {!address && (
          <div className="mb-5 rounded-xl border border-blue/20 bg-blue/[0.04]
                          px-5 py-4 flex items-center justify-between gap-4 flex-wrap">
            <p className="text-sm text-white/50">
              Connect your wallet to spin with real KRKS tokens.
            </p>
            <button onClick={connect} disabled={connecting}
              className="px-5 py-2.5 rounded-xl bg-blue hover:bg-blue-deep text-white
                         font-display font-bold text-sm transition-all disabled:opacity-50">
              {connecting ? "Connecting…" : "Connect Wallet"}
            </button>
          </div>
        )}
        {address && !isCorrectChain && (
          <div className="mb-5 rounded-xl border border-red-500/25 bg-red-500/[0.04]
                          px-5 py-3 flex items-center justify-between gap-4">
            <p className="text-sm text-red-300/80">Wrong network — switch to KARKAS (Chain ID 144411)</p>
            <button onClick={switchToKarkas}
              className="px-4 py-2 rounded-lg bg-red-500/15 border border-red-500/25
                         text-red-300 text-sm font-bold hover:bg-red-500/25 transition-all">
              Switch
            </button>
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center justify-around rounded-2xl border border-white/5
                        bg-white/[0.02] px-4 py-4 mb-5 flex-wrap gap-4">
          <StatCard label="Spins"   value={stats.spins} />
          <div className="w-px h-8 bg-white/5 hidden sm:block" />
          <StatCard label="Won"     value={stats.won}  color="text-green-400" />
          <div className="w-px h-8 bg-white/5 hidden sm:block" />
          <StatCard label="Lost"    value={stats.lost} color="text-red-400" />
          <div className="w-px h-8 bg-white/5 hidden sm:block" />
          <StatCard
            label="Net P&L"
            value={(pnlPos ? "+" : "") + stats.pnl.toFixed(3) + " KRKS"}
            color={pnlPos ? "text-green-400" : "text-red-400"}
          />
          {isDeployed && (
            <>
              <div className="w-px h-8 bg-white/5 hidden sm:block" />
              <StatCard label="Total Spins" value={totalSpins} color="text-blue" />
            </>
          )}
        </div>

        {/* Machine */}
        <div className={`rounded-2xl border overflow-hidden mb-5 transition-all duration-700
          ${glow
            ? "border-green-500/35 shadow-[0_0_60px_rgba(74,222,128,0.18)]"
            : "border-white/[0.08] shadow-[0_0_40px_rgba(0,0,0,0.5)]"}
          bg-white/[0.02] backdrop-blur-sm`}>

          {/* Reel */}
          <RouletteReel ref={reelRef} />

          {/* Status bar */}
          <div className={`text-center py-3 px-6 border-t border-white/5
                           font-display font-bold text-sm tracking-wide transition-colors duration-500
            ${!result && !waiting  ? "text-white/20" : ""}
            ${waiting              ? "text-blue/80 animate-pulse" : ""}
            ${result?.won          ? "text-green-400 drop-shadow-[0_0_10px_rgba(74,222,128,0.5)]" : ""}
            ${result?.won === false ? "text-red-400   drop-shadow-[0_0_10px_rgba(248,113,113,0.4)]" : ""}
          `}>
            {!result && !waiting && !spinning && "Place your bet and spin the wheel"}
            {spinning && "Sending transaction…"}
            {waiting  && "⏳ Oracle resolving your spin…"}
            {result?.refunded && "⏱ Oracle timed out — bet refunded"}
            {result && !result.refunded && result.won  === true  &&
              `🎉 ${result.outcome.emoji} You won ${result.payout.toFixed(3)} KRKS!`}
            {result && !result.refunded && result.won  === false &&
              `💀 Miss — lost ${result.bet.toFixed(2)} KRKS`}
          </div>

          {/* Tx link */}
          {txHash && (
            <div className="text-center pb-2">
              <a href={`${NETWORK.explorerUrl}/tx/${txHash}`} target="_blank" rel="noreferrer"
                 className="text-[10px] font-mono text-blue/50 hover:text-blue transition-colors">
                {txHash.slice(0,12)}… ↗
              </a>
            </div>
          )}

          {/* Controls */}
          <div className="border-t border-white/5 px-6 py-5
                          flex flex-wrap items-end gap-5">

            {/* Bet input */}
            <div className="flex flex-col gap-2 flex-1 min-w-[180px]">
              <label className="text-[10px] tracking-[0.15em] uppercase text-white/35">
                Your Bet
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={bet}
                  min={minBet} max={maxBet} step="0.01"
                  onChange={e => setBet(e.target.value)}
                  disabled={isSpinning}
                  className="w-28 px-3 py-2.5 rounded-xl border border-white/10 bg-white/[0.04]
                             text-white font-display font-bold text-base
                             outline-none focus:border-blue/60 transition-colors
                             disabled:opacity-40"
                />
                <span className="text-gold/70 font-bold text-sm">KRKS</span>
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {[0.1, 0.5, 1, 5].map(v => (
                  <button key={v}
                    onClick={() => setBet(String(v))}
                    disabled={isSpinning}
                    className="px-2.5 py-1 rounded-lg text-xs font-bold
                               border border-white/10 bg-white/[0.04] text-white/45
                               hover:text-white hover:border-blue/40 hover:bg-blue/10
                               transition-all disabled:opacity-30">
                    {v}
                  </button>
                ))}
                <button
                  onClick={() => setBet(v => String(Math.max(minBet, parseFloat(v)/2).toFixed(2)))}
                  disabled={isSpinning}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold
                             border border-white/10 bg-white/[0.04] text-white/45
                             hover:text-white transition-all disabled:opacity-30">½</button>
                <button
                  onClick={() => setBet(v => String(Math.min(maxBet, parseFloat(v)*2).toFixed(2)))}
                  disabled={isSpinning}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold
                             border border-white/10 bg-white/[0.04] text-white/45
                             hover:text-white transition-all disabled:opacity-30">2×</button>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-3 ml-auto">

              {/* Refund button when expired */}
              {pendingId && !waiting && (
                <button
                  onClick={() => claimRefund(pendingId)}
                  className="px-4 py-3 rounded-xl border border-yellow-500/30
                             bg-yellow-500/5 text-yellow-300 text-sm font-bold
                             hover:bg-yellow-500/10 transition-all font-display">
                  ⏱ Claim Refund
                </button>
              )}

              <button
                onClick={handleDemoSpin}
                disabled={isSpinning}
                className="px-5 py-3 rounded-xl border border-white/10 bg-white/[0.03]
                           text-white/45 font-display font-bold text-sm
                           hover:text-white hover:border-white/20 transition-all
                           disabled:opacity-30 disabled:cursor-not-allowed">
                Demo Spin
              </button>

              <button
                onClick={handleRealSpin}
                disabled={isSpinning || !address || !isCorrectChain || !isDeployed}
                className="relative px-8 py-3 rounded-xl font-display font-bold text-base
                           text-navy overflow-hidden transition-all
                           hover:-translate-y-0.5
                           disabled:opacity-40 disabled:cursor-not-allowed
                           disabled:hover:translate-y-0"
                style={{
                  background: "linear-gradient(135deg,#F7DD7D 0%,#e8c84a 100%)",
                  boxShadow:  isSpinning ? "none" : "0 4px 20px rgba(247,221,125,0.3)",
                }}>
                <span className="relative z-10">
                  {spinning ? "Sending…" : waiting ? "Waiting…" : "🎰 Spin!"}
                </span>
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
              </button>
            </div>
          </div>
        </div>

        {/* Legend */}
        <Legend />

        {/* How it works */}
        <div className="mt-5 rounded-2xl border border-white/5 bg-white/[0.02] px-5 py-4">
          <div className="text-[10px] tracking-[0.2em] uppercase text-white/25 mb-3">
            How fairness works
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            {[
              { n:"1", t:"You lock a bet",     d:"requestSpin() locks your KRKS on-chain. A unique request ID is issued." },
              { n:"2", t:"Oracle signs seed",  d:"Off-chain oracle generates crypto.randomBytes(32), signs it with its private key." },
              { n:"3", t:"Result on-chain",    d:"Contract verifies the signature. Seed is mixed with the next blockhash — neither oracle nor miner can predict the outcome." },
            ].map(s => (
              <div key={s.n} className="flex gap-3">
                <div className="w-6 h-6 rounded-full border border-blue/30 bg-blue/10
                                flex items-center justify-center text-[10px] font-bold
                                text-blue shrink-0 mt-0.5">
                  {s.n}
                </div>
                <div>
                  <div className="text-xs font-semibold text-white/70 mb-1">{s.t}</div>
                  <div className="text-xs text-white/35 leading-relaxed">{s.d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* History */}
        <div className="mt-5 rounded-2xl border border-white/5 bg-white/[0.02] p-5">
          <div className="text-[10px] tracking-[0.2em] uppercase text-white/25 mb-4">Spin History</div>
          {localHistory.length === 0
            ? <p className="text-center text-white/20 text-sm py-5">No spins yet. Try a demo spin!</p>
            : <div className="flex flex-col gap-2">
                {localHistory.map((h, i) => (
                  <HistoryRow key={h.id} h={h} isNew={i === newIdx} />
                ))}
              </div>
          }
        </div>

      </div>

      {toast && (
        <Toast key={toast.key} msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
