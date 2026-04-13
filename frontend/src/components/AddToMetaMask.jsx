import { useState } from "react";
import { NETWORK } from "../config.js";

const STATUS = {
  idle: "idle",
  pending: "pending",
  success: "success",
  error: "error",
  noWallet: "noWallet",
};

export default function AddToMetaMask({ className = "" }) {
  const [status, setStatus] = useState(STATUS.idle);
  const [errorMsg, setErrorMsg] = useState("");

  async function handleAdd() {
    if (!window.ethereum) {
      setStatus(STATUS.noWallet);
      return;
    }

    setStatus(STATUS.pending);
    setErrorMsg("");

    try {
      // Try wallet_addEthereumChain (EIP-3085)
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: NETWORK.chainIdHex,
            chainName: NETWORK.name,
            nativeCurrency: NETWORK.currency,
            rpcUrls: [NETWORK.rpcUrl],
            blockExplorerUrls: [NETWORK.explorerUrl],
          },
        ],
      });
      setStatus(STATUS.success);
      // Reset back to idle after 3s
      setTimeout(() => setStatus(STATUS.idle), 3000);
    } catch (err) {
      // User rejected (4001) — not an error, just cancelled
      if (err?.code === 4001) {
        setStatus(STATUS.idle);
        return;
      }
      console.error("[AddToMetaMask]", err);
      setErrorMsg(err?.message || "Unknown error");
      setStatus(STATUS.error);
      setTimeout(() => setStatus(STATUS.idle), 4000);
    }
  }

  const label = {
    [STATUS.idle]:     "Add to MetaMask",
    [STATUS.pending]:  "Confirm in MetaMask…",
    [STATUS.success]:  "✓ Network Added!",
    [STATUS.error]:    "Failed — try again",
    [STATUS.noWallet]: "MetaMask not found",
  }[status];

  const colors = {
    [STATUS.idle]:     "btn-primary",
    [STATUS.pending]:  "btn-primary opacity-70 cursor-wait",
    [STATUS.success]:  "bg-emerald-600 hover:bg-emerald-500 text-white font-display font-semibold px-6 py-3 rounded-xl transition-all duration-200 active:scale-95",
    [STATUS.error]:    "bg-red-700 hover:bg-red-600 text-white font-display font-semibold px-6 py-3 rounded-xl transition-all duration-200 active:scale-95",
    [STATUS.noWallet]: "bg-amber-600 hover:bg-amber-500 text-white font-display font-semibold px-6 py-3 rounded-xl transition-all duration-200 active:scale-95",
  }[status];

  return (
    <div className={`flex flex-col items-start gap-2 ${className}`}>
      <button
        onClick={handleAdd}
        disabled={status === STATUS.pending}
        className={`flex items-center gap-2.5 ${colors}`}
      >
        {/* MetaMask fox icon */}
        <svg width="22" height="22" viewBox="0 0 35 33" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M32.958.528 19.327 10.64l2.522-5.984L32.958.528z" fill="#E17726"/>
          <path d="M2.042.528l13.52 10.196-2.4-6.068L2.042.528z" fill="#E27625"/>
          <path d="M28.226 23.534l-3.634 5.56 7.776 2.14 2.228-7.56-6.37-.14z" fill="#E27625"/>
          <path d="M.418 23.674l2.216 7.56 7.764-2.14-3.622-5.56-6.358.14z" fill="#E27625"/>
          <path d="M9.98 14.357l-2.172 3.28 7.736.352-.266-8.316-5.298 4.684z" fill="#E27625"/>
          <path d="M25.02 14.357l-5.374-4.77-.176 8.402 7.724-.352-2.174-3.28z" fill="#E27625"/>
          <path d="M10.398 29.094l4.654-2.254-4.018-3.136-.636 5.39z" fill="#E27625"/>
          <path d="M20.948 26.84l4.654 2.254-.624-5.39-4.03 3.136z" fill="#E27625"/>
        </svg>
        {label}
      </button>

      {status === STATUS.noWallet && (
        <p className="text-xs text-amber-400">
          Install{" "}
          <a
            href="https://metamask.io/download/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-amber-300"
          >
            MetaMask
          </a>{" "}
          first, then click again.
        </p>
      )}
      {status === STATUS.error && errorMsg && (
        <p className="text-xs text-red-400 max-w-xs">{errorMsg}</p>
      )}
    </div>
  );
}
