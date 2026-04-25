// src/components/RouletteReel.jsx
import { useRef, useEffect, useImperativeHandle, forwardRef } from "react";
import { RARITY_INFO } from "../config/network";

// Generates a big pool of items to fill the strip
const POOL_SIZE = 100;

function makePool() {
  const pool = [];
  for (let i = 0; i < POOL_SIZE; i++) {
    const r = Math.random() * 100;
    const info = r < 50 ? RARITY_INFO[0]
               : r < 75 ? RARITY_INFO[1]
               : r < 90 ? RARITY_INFO[2]
               : r < 98 ? RARITY_INFO[3]
               :           RARITY_INFO[4];
    pool.push(info);
  }
  return pool;
}

const ITEM_W   = 112; // px
const ITEM_GAP = 6;
const STEP     = ITEM_W + ITEM_GAP;
const LAND_IDX = 70; // where the winner lands (near end)

const rarityBg = {
  0: "bg-slate-700/80  border-slate-600/60",
  1: "bg-blue-900/80   border-blue-600/40",
  2: "bg-purple-900/80 border-purple-500/40",
  3: "bg-yellow-900/70 border-yellow-400/40",
  4: "bg-red-900/80    border-red-500/40",
};
const rarityText = {
  0: "text-slate-400",
  1: "text-blue-300",
  2: "text-purple-300",
  3: "text-yellow-300",
  4: "text-red-300",
};
const rarityGlow = {
  0: "",
  1: "shadow-[0_0_20px_rgba(66,153,225,0.4)]",
  2: "shadow-[0_0_20px_rgba(159,122,234,0.4)]",
  3: "shadow-[0_0_24px_rgba(247,221,125,0.45)]",
  4: "shadow-[0_0_28px_rgba(252,129,129,0.5)]",
};

function ReelItem({ info, highlighted }) {
  return (
    <div
      className={`
        flex-shrink-0 flex flex-col items-center justify-center gap-1
        rounded-xl border-2 transition-all duration-200 select-none
        ${rarityBg[info.id]}
        ${highlighted
          ? `border-gold ${rarityGlow[info.id]} scale-105`
          : "border-transparent"
        }
      `}
      style={{ width: ITEM_W, height: 96 }}
    >
      <span className="text-3xl leading-none">{info.emoji}</span>
      <span className={`text-xs font-bold tracking-wide font-display ${rarityText[info.id]}`}>
        {info.label}
      </span>
    </div>
  );
}

const RouletteReel = forwardRef(function RouletteReel({ onAnimEnd }, ref) {
  const trackRef    = useRef(null);
  const wrapRef     = useRef(null);
  const poolRef     = useRef(makePool());
  const winnerIdxRef = useRef(LAND_IDX);
  const hlIdxRef    = useRef(null);
  const renderKey   = useRef(0);

  // Expose spin() to parent
  useImperativeHandle(ref, () => ({
    spin(winner) {
      if (!trackRef.current || !wrapRef.current) return;

      // Rebuild pool, inject winner at LAND_IDX
      const pool = makePool();
      pool[LAND_IDX] = winner;
      poolRef.current = pool;
      hlIdxRef.current = null;
      renderKey.current++;

      // Force re-render by updating DOM directly for performance
      buildTrackDOM(pool, -1);

      // Reset to start (no animation)
      const wrapW = wrapRef.current.offsetWidth;
      const startX = wrapW / 2 - STEP * 5 - ITEM_W / 2; // show first items
      trackRef.current.style.transition = "none";
      trackRef.current.style.transform  = `translateX(${startX}px)`;

      // Small delay then animate to winner
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const endX   = wrapW / 2 - STEP * LAND_IDX - ITEM_W / 2;
          const dur    = 4000 + Math.random() * 800;
          trackRef.current.style.transition = `transform ${dur}ms cubic-bezier(0.17,0.67,0.06,1.0)`;
          trackRef.current.style.transform  = `translateX(${endX}px)`;

          setTimeout(() => {
            hlIdxRef.current = LAND_IDX;
            buildTrackDOM(pool, LAND_IDX);
            onAnimEnd?.(winner);
          }, dur + 80);
        });
      });
    },

    reset() {
      const pool = makePool();
      poolRef.current = pool;
      hlIdxRef.current = null;
      buildTrackDOM(pool, -1);
      if (wrapRef.current && trackRef.current) {
        const wrapW = wrapRef.current.offsetWidth;
        const startX = wrapW / 2 - STEP * 5 - ITEM_W / 2;
        trackRef.current.style.transition = "none";
        trackRef.current.style.transform  = `translateX(${startX}px)`;
      }
    },
  }));

  function buildTrackDOM(pool, hlIdx) {
    if (!trackRef.current) return;
    trackRef.current.innerHTML = "";
    pool.forEach((info, i) => {
      const el  = document.createElement("div");
      const hl  = i === hlIdx;
      el.style.cssText = `
        flex-shrink:0;
        display:flex; flex-direction:column; align-items:center; justify-content:center; gap:4px;
        width:${ITEM_W}px; height:96px;
        border-radius:12px; border:2px solid;
        user-select:none; transition:all 0.2s;
        border-color: ${hl
          ? "#F7DD7D"
          : "transparent"};
        background: ${
          info.id === 0 ? "rgba(60,70,90,0.8)"
        : info.id === 1 ? "rgba(30,60,120,0.8)"
        : info.id === 2 ? "rgba(80,30,120,0.8)"
        : info.id === 3 ? "rgba(120,90,0,0.7)"
        :                  "rgba(120,20,20,0.8)"};
        ${hl ? "transform:scale(1.05);" : ""}
        ${hl && info.id === 3 ? "box-shadow:0 0 24px rgba(247,221,125,0.45);" : ""}
        ${hl && info.id === 4 ? "box-shadow:0 0 28px rgba(252,129,129,0.5);" : ""}
        ${hl && info.id === 2 ? "box-shadow:0 0 20px rgba(159,122,234,0.4);" : ""}
        ${hl && info.id === 1 ? "box-shadow:0 0 20px rgba(66,153,225,0.4);" : ""}
      `;
      const color = ["#94a3b8","#90caf9","#ce93d8","#F7DD7D","#fc8181"][info.id];
      el.innerHTML = `
        <span style="font-size:28px;line-height:1;">${info.emoji}</span>
        <span style="font-size:11px;font-weight:700;letter-spacing:0.05em;color:${color};font-family:'Clash Grotesk',sans-serif;">${info.label}</span>
      `;
      trackRef.current.appendChild(el);
    });
  }

  // Initial render
  useEffect(() => {
    const pool = makePool();
    poolRef.current = pool;
    buildTrackDOM(pool, -1);
    if (wrapRef.current && trackRef.current) {
      const wrapW = wrapRef.current.offsetWidth;
      trackRef.current.style.transform = `translateX(${wrapW / 2 - STEP * 5 - ITEM_W / 2}px)`;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    /* Outer wrapper */
    <div className="relative w-full" style={{ height: 120 }}>

      {/* Track container */}
      <div
        ref={wrapRef}
        className="absolute inset-0 overflow-hidden bg-black/40"
      >
        {/* Scrolling strip */}
        <div
          ref={trackRef}
          className="absolute top-0 bottom-0 flex items-center"
          style={{ gap: ITEM_GAP, paddingLeft: ITEM_GAP, willChange: "transform" }}
        />

        {/* Fade edges */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-36 z-10"
          style={{ background: "linear-gradient(to right, #0C101B 0%, transparent 100%)" }} />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-36 z-10"
          style={{ background: "linear-gradient(to left, #0C101B 0%, transparent 100%)" }} />
      </div>

      {/* Center pointer (arrows + frame) */}
      <div className="pointer-events-none absolute inset-y-0 left-1/2 -translate-x-1/2 z-20"
           style={{ width: ITEM_W + 4 }}>
        {/* Top arrow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0 h-0"
             style={{ borderLeft:"10px solid transparent", borderRight:"10px solid transparent",
                      borderTop:"14px solid #F7DD7D" }} />
        {/* Bottom arrow */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0"
             style={{ borderLeft:"10px solid transparent", borderRight:"10px solid transparent",
                      borderBottom:"14px solid #F7DD7D" }} />
        {/* Side borders */}
        <div className="absolute inset-y-0 left-0 w-px bg-gold/60" />
        <div className="absolute inset-y-0 right-0 w-px bg-gold/60" />
      </div>
    </div>
  );
});

export default RouletteReel;
