// src/hooks/useRoulette.js
import { useState, useCallback, useEffect, useRef } from "react";
import { ethers } from "ethers";
import { ROULETTE_ADDRESS, ROULETTE_ABI, RARITY_INFO, IS_DEPLOYED } from "../config/network";

const POLL_MS = 4000; // poll for SpinResult event every 4s

export function useRoulette(signer, provider, address) {
  const [prizePool,   setPrizePool]   = useState(null);
  const [minBet,      setMinBet]      = useState(0.01);
  const [maxBet,      setMaxBet]      = useState(10);
  const [totalSpins,  setTotalSpins]  = useState(0);
  const [pendingId,   setPendingId]   = useState(null);  // current requestId
  const [spinning,    setSpinning]    = useState(false);
  const [waiting,     setWaiting]     = useState(false); // waiting for oracle
  const [error,       setError]       = useState(null);
  const [txHash,      setTxHash]      = useState(null);

  const pollerRef = useRef(null);

  const getContract = useCallback((signerOrProvider) => {
    if (!IS_DEPLOYED) return null;
    return new ethers.Contract(ROULETTE_ADDRESS, ROULETTE_ABI, signerOrProvider);
  }, []);

  // Fetch static contract state
  const fetchState = useCallback(async () => {
    if (!provider || !IS_DEPLOYED) return;
    try {
      const c = getContract(provider);
      const [pool, min, max, spins] = await Promise.all([
        c.prizePool(),
        c.minBet?.() ?? c.getBetLimits().then(r => r.min),
        c.maxBet?.() ?? c.getBetLimits().then(r => r.max),
        c.totalSpins(),
      ]);
      setPrizePool(parseFloat(ethers.formatEther(pool)));
      setMinBet(parseFloat(ethers.formatEther(min)));
      setMaxBet(parseFloat(ethers.formatEther(max)));
      setTotalSpins(Number(spins));
    } catch (e) { console.warn("fetchState:", e.message); }
  }, [provider, getContract]);

  useEffect(() => { fetchState(); }, [fetchState]);

  /**
   * Poll for SpinResult / BetRefunded for the given requestId.
   * Stops when event found or timeout.
   */
  const pollForResult = useCallback((requestId, betAmt, onResult) => {
    if (!provider || !IS_DEPLOYED) return;
    const c       = getContract(provider);
    const started = Date.now();
    const TIMEOUT = 5 * 60 * 1000; // 5 min

    const check = async () => {
      if (!pollerRef.current) return; // stopped

      // Check request state on-chain
      try {
        const req = await c.getRequest(requestId);
        // state: 0=Pending, 1=Fulfilled, 2=Refunded
        if (Number(req.state) === 1) {
          // Query SpinResult logs for this id
          const filter = c.filters.SpinResult(requestId);
          const logs   = await c.queryFilter(filter, -500);
          if (logs.length > 0) {
            const ev     = logs[0];
            const rarity = Number(ev.args.rarity);
            const payout = parseFloat(ethers.formatEther(ev.args.payout));
            onResult({ outcome: RARITY_INFO[rarity], payout, refunded: false });
            return;
          }
        }
        if (Number(req.state) === 2) {
          onResult({ outcome: RARITY_INFO[0], payout: betAmt, refunded: true });
          return;
        }
      } catch { /* rpc blip — retry */ }

      if (Date.now() - started > TIMEOUT) {
        setError("Oracle timeout. Use 'Claim Refund' button.");
        setWaiting(false);
        setSpinning(false);
        pollerRef.current = null;
        return;
      }

      pollerRef.current = setTimeout(check, POLL_MS);
    };

    pollerRef.current = setTimeout(check, POLL_MS);
  }, [provider, getContract]);

  /**
   * Stop any active poller.
   */
  const stopPoller = useCallback(() => {
    if (pollerRef.current) { clearTimeout(pollerRef.current); pollerRef.current = null; }
  }, []);

  /**
   * Main spin: calls requestSpin() on-chain, waits for oracle to fulfill.
   * onResult(outcome, payout) is called when done.
   */
  const spinReal = useCallback(async (betEth, onResult) => {
    if (!signer || !IS_DEPLOYED || spinning) return;
    setSpinning(true);
    setWaiting(false);
    setError(null);
    setTxHash(null);
    stopPoller();

    try {
      const c      = getContract(signer);
      const betWei = ethers.parseEther(String(betEth));

      const tx = await c.requestSpin({ value: betWei });
      setTxHash(tx.hash);

      const receipt = await tx.wait(1);

      // Extract requestId from RequestRandom event
      const iface = c.interface;
      let requestId = null;
      for (const log of receipt.logs) {
        try {
          const parsed = iface.parseLog(log);
          if (parsed?.name === "RequestRandom") {
            requestId = parsed.args.id;
            break;
          }
        } catch { /* skip non-matching logs */ }
      }

      if (!requestId) throw new Error("No RequestRandom event found in receipt");

      setPendingId(requestId);
      setSpinning(false);
      setWaiting(true); // spinning animation starts, waiting for oracle

      // Poll until oracle fulfills
      pollForResult(requestId, betEth, (result) => {
        setWaiting(false);
        setPendingId(null);
        fetchState();
        onResult(result);
      });

    } catch (e) {
      const msg = e?.reason || e?.shortMessage || e?.message || "Transaction failed";
      setError(msg);
      setSpinning(false);
      setWaiting(false);
    }
  }, [signer, spinning, getContract, pollForResult, stopPoller, fetchState]);

  /**
   * Demo spin — no chain interaction.
   */
  const spinDemo = useCallback(() => {
    const r = Math.random() * 100;
    if (r < 50) return RARITY_INFO[0];
    if (r < 75) return RARITY_INFO[1];
    if (r < 90) return RARITY_INFO[2];
    if (r < 98) return RARITY_INFO[3];
    return RARITY_INFO[4];
  }, []);

  /**
   * Claim refund for an expired request.
   */
  const claimRefund = useCallback(async (requestId) => {
    if (!signer || !IS_DEPLOYED) return;
    try {
      const c  = getContract(signer);
      const tx = await c.refundExpired(requestId);
      await tx.wait(1);
      setPendingId(null);
      setWaiting(false);
      fetchState();
    } catch (e) {
      setError(e?.reason || e?.message || "Refund failed");
    }
  }, [signer, getContract, fetchState]);

  // Cleanup on unmount
  useEffect(() => () => stopPoller(), [stopPoller]);

  return {
    prizePool, minBet, maxBet, totalSpins,
    spinning, waiting, error, txHash, pendingId,
    isDeployed: IS_DEPLOYED,
    spinReal, spinDemo, claimRefund, fetchState,
    clearError: () => setError(null),
  };
}
