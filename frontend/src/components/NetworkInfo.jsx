import { useState } from "react";
import { NETWORK } from "../config.js";

function Row({ label, value, copy = false }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div className="flex items-center justify-between py-3 border-b border-dark-500/40 last:border-0">
      <span className="text-sm text-slate-400 font-body">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-mono text-slate-200">{value}</span>
        {copy && (
          <button
            onClick={handleCopy}
            title="Copy"
            className="text-slate-500 hover:text-brand-400 transition-colors text-xs"
          >
            {copied ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-4 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

export default function NetworkInfo() {
  return (
    <div className="card">
      <h3 className="font-display font-semibold text-lg mb-4 text-white">
        Network Details
      </h3>
      <div>
        <Row label="Network Name"     value={NETWORK.name}             copy />
        <Row label="Chain ID"         value={NETWORK.chainId}          copy />
        <Row label="Currency Symbol"  value={NETWORK.currency.symbol}  />
        <Row label="RPC URL"          value={NETWORK.rpcUrl}           copy />
        <Row label="Block Explorer"   value={NETWORK.explorerUrl}      copy />
      </div>
    </div>
  );
}
