import { useState, useEffect } from "react";

function formatCountdown(ms) {
  if (ms <= 0) return "now";
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${h}h ${m}m ${s}s`;
}

export default function App() {
  const [info, setInfo] = useState(null);
  const [address, setAddress] = useState("");
  const [status, setStatus] = useState(null); // { canClaim, nextClaimAt }
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null); // { ok, txHash } | { error }
  const [countdown, setCountdown] = useState("");
  const [addingNetwork, setAddingNetwork] = useState(false);

  useEffect(() => {
    fetch("/api/info")
      .then((r) => r.json())
      .then(setInfo)
      .catch(() => {});
  }, []);

  // Countdown timer
  useEffect(() => {
    if (!status?.nextClaimAt) return;
    const tick = () => {
      const ms = status.nextClaimAt - Date.now();
      if (ms <= 0) {
        setCountdown("");
        setStatus({ canClaim: true, nextClaimAt: null });
      } else {
        setCountdown(formatCountdown(ms));
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [status?.nextClaimAt]);

  const checkStatus = async (addr) => {
    if (!addr || !/^0x[0-9a-fA-F]{40}$/.test(addr)) return;
    try {
      const r = await fetch(`/api/status/${addr}`);
      const d = await r.json();
      setStatus(d);
    } catch {}
  };

  const handleAddressChange = (e) => {
    const val = e.target.value;
    setAddress(val);
    setResult(null);
    setStatus(null);
    if (/^0x[0-9a-fA-F]{40}$/.test(val)) checkStatus(val);
  };

  const handleRequest = async () => {
    if (!address) return;
    setLoading(true);
    setResult(null);
    try {
      const r = await fetch("/api/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
      });
      const d = await r.json();
      if (r.ok) {
        setResult({ ok: true, txHash: d.txHash });
        setStatus({ canClaim: false, nextClaimAt: Date.now() + 24 * 3600 * 1000 });
      } else {
        setResult({ error: d.error, nextClaimAt: d.nextClaimAt });
        if (d.nextClaimAt) setStatus({ canClaim: false, nextClaimAt: d.nextClaimAt });
      }
    } catch (e) {
      setResult({ error: "Network error" });
    }
    setLoading(false);
  };

  const handleAddNetwork = async () => {
    if (!window.ethereum || !info) return;
    setAddingNetwork(true);
    try {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: "0x" + info.chainId.toString(16),
            chainName: info.networkName,
            nativeCurrency: {
              name: info.symbol,
              symbol: info.symbol,
              decimals: 18,
            },
            rpcUrls: [info.rpcUrl],
            blockExplorerUrls: [info.explorerUrl],
          },
        ],
      });
    } catch (e) {
      console.error(e);
    }
    setAddingNetwork(false);
  };

  const canSubmit =
    /^0x[0-9a-fA-F]{40}$/.test(address) &&
    !loading &&
    (status === null || status.canClaim);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-indigo-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 mb-4">
            <svg className="w-8 h-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">
            {info?.networkName || "KARKAS"} Faucet
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Get {info?.amountEth || "1"} {info?.symbol || "KRKS"} per day
          </p>
        </div>

        {/* Card */}
        <div className="bg-gray-900/80 backdrop-blur border border-gray-800 rounded-2xl p-6 shadow-xl">
          {/* Address input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Wallet Address
            </label>
            <input
              type="text"
              value={address}
              onChange={handleAddressChange}
              placeholder="0x..."
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 text-sm placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
            />
          </div>

          {/* Status indicator */}
          {status && address && (
            <div className={`mb-4 px-4 py-3 rounded-xl text-sm flex items-center gap-2 ${
              status.canClaim
                ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                : "bg-amber-500/10 border border-amber-500/30 text-amber-400"
            }`}>
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${status.canClaim ? "bg-emerald-400" : "bg-amber-400"}`} />
              {status.canClaim
                ? "This address can claim tokens"
                : `Next claim in ${countdown}`}
            </div>
          )}

          {/* Request button */}
          <button
            onClick={handleRequest}
            disabled={!canSubmit}
            className="w-full py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-200
              bg-indigo-600 hover:bg-indigo-500 text-white
              disabled:opacity-40 disabled:cursor-not-allowed
              focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Sending...
              </span>
            ) : (
              `Request ${info?.amountEth || "1"} ${info?.symbol || "KRKS"}`
            )}
          </button>

          {/* Result */}
          {result && (
            <div className={`mt-4 px-4 py-3 rounded-xl text-sm ${
              result.ok
                ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                : "bg-red-500/10 border border-red-500/30 text-red-400"
            }`}>
              {result.ok ? (
                <div>
                  <p className="font-semibold mb-1">Tokens sent!</p>
                  <a
                    href={`${info?.explorerUrl || ""}/tx/${result.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs underline opacity-75 hover:opacity-100 break-all"
                  >
                    {result.txHash}
                  </a>
                </div>
              ) : (
                <p>{result.error}</p>
              )}
            </div>
          )}
        </div>

        {/* Add to MetaMask */}
        {info && (
          <div className="mt-4">
            <button
              onClick={handleAddNetwork}
              disabled={addingNetwork || !window.ethereum}
              className="w-full py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-200
                bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30
                text-orange-400 hover:text-orange-300
                disabled:opacity-40 disabled:cursor-not-allowed
                focus:outline-none"
            >
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4" viewBox="0 0 35 33" fill="none">
                  <path d="M32.9582 1L19.8241 10.7183L22.2665 5.09986L32.9582 1Z" fill="#E17726"/>
                  <path d="M2.04858 1L15.0707 10.809L12.7423 5.09986L2.04858 1Z" fill="#E27625"/>
                  <path d="M28.2292 23.5334L24.7346 28.872L32.2111 30.9324L34.3873 23.6501L28.2292 23.5334Z" fill="#E27625"/>
                  <path d="M0.627319 23.6501L2.79061 30.9324L10.2542 28.872L6.77262 23.5334L0.627319 23.6501Z" fill="#E27625"/>
                </svg>
                {window.ethereum ? "Add to MetaMask" : "MetaMask not detected"}
              </span>
            </button>
          </div>
        )}

        {/* Info footer */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <a
            href={info?.explorerUrl || "https://explorer.marakyja.xyz"}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs text-gray-400 hover:text-gray-300 bg-gray-900/50 border border-gray-800 hover:border-gray-700 transition"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Explorer
          </a>
          <div className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs text-gray-400 bg-gray-900/50 border border-gray-800">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            1 {info?.symbol || "KRKS"} / 24h
          </div>
        </div>
      </div>
    </div>
  );
}
