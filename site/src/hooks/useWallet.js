// src/hooks/useWallet.js
import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { NETWORK } from "../config/network";

export function useWallet() {
  const [address, setAddress]     = useState(null);
  const [balance, setBalance]     = useState(null); // BigInt wei
  const [provider, setProvider]   = useState(null);
  const [signer, setSigner]       = useState(null);
  const [chainId, setChainId]     = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError]         = useState(null);

  const isCorrectChain = chainId === NETWORK.chainId;

  const refreshBalance = useCallback(async (addr, prov) => {
    try {
      const bal = await prov.getBalance(addr);
      setBalance(bal);
    } catch { setBalance(null); }
  }, []);

  const switchToKarkas = useCallback(async () => {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: NETWORK.chainIdHex }],
      });
    } catch (e) {
      if (e.code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [{
            chainId:  NETWORK.chainIdHex,
            chainName: NETWORK.name,
            nativeCurrency: { name: NETWORK.name, symbol: NETWORK.symbol, decimals: 18 },
            rpcUrls: [NETWORK.rpcUrl],
            blockExplorerUrls: [NETWORK.explorerUrl],
          }],
        });
      } else throw e;
    }
  }, []);

  const connect = useCallback(async () => {
    if (!window.ethereum) { setError("MetaMask not detected"); return; }
    setConnecting(true); setError(null);
    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      const prov  = new ethers.BrowserProvider(window.ethereum);
      const sign  = await prov.getSigner();
      const net   = await prov.getNetwork();

      setAddress(accounts[0]);
      setProvider(prov);
      setSigner(sign);
      setChainId(Number(net.chainId));

      await refreshBalance(accounts[0], prov);

      if (Number(net.chainId) !== NETWORK.chainId) {
        await switchToKarkas();
      }
    } catch(e) {
      setError(e.message || "Connection failed");
    }
    setConnecting(false);
  }, [refreshBalance, switchToKarkas]);

  const disconnect = useCallback(() => {
    setAddress(null); setBalance(null); setSigner(null); setProvider(null); setChainId(null);
  }, []);

  // Listen for MetaMask events
  useEffect(() => {
    if (!window.ethereum) return;
    const onAccounts = (accounts) => {
      if (accounts.length === 0) disconnect();
      else { setAddress(accounts[0]); if (provider) refreshBalance(accounts[0], provider); }
    };
    const onChain = (id) => setChainId(parseInt(id, 16));
    window.ethereum.on("accountsChanged", onAccounts);
    window.ethereum.on("chainChanged", onChain);
    return () => {
      window.ethereum.removeListener("accountsChanged", onAccounts);
      window.ethereum.removeListener("chainChanged", onChain);
    };
  }, [provider, disconnect, refreshBalance]);

  const balanceEth = balance != null ? parseFloat(ethers.formatEther(balance)) : null;

  return {
    address, balance, balanceEth, provider, signer, chainId,
    connecting, error, isCorrectChain,
    connect, disconnect, switchToKarkas,
    refresh: () => provider && address && refreshBalance(address, provider),
  };
}
