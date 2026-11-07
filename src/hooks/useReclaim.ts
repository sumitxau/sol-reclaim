"use client";
   import { Error } from "@/lib/Error";
import { useState, useEffect, useCallback } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  scanWalletAccounts,
  reclaimSelectedAccounts,
  TokenAccountItem,
} from "@/services/reclaimService";
import { FEE_RATE, MAX_BATCH } from "@/config/constants";

export function useReclaim() {
  const { connection } = useConnection();
  const wallet = useWallet();

  const [tab, setTab] = useState<"empty" | "dust">("empty");
  const [emptyList, setEmptyList] = useState<TokenAccountItem[]>([]);
  const [dustList, setDustList] = useState<TokenAccountItem[]>([]);
  const [selectedAtas, setSelectedAtas] = useState<string[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isReclaiming, setIsReclaiming] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "", signature: "" });

  // Scan wallet
  const runScan = useCallback(async () => {
    if (!wallet.publicKey) {
      setEmptyList([]);
      setDustList([]);
      setSelectedAtas([]);
      return;
    }

    setIsScanning(true);
    setStatus({ type: "", message: "", signature: "" });

    try {
      const { emptyList: eList, dustList: dList } = await scanWalletAccounts(
        connection,
        wallet.publicKey
      );
      setEmptyList(eList);
      setDustList(dList);
      setSelectedAtas(eList.slice(0, MAX_BATCH).map((a) => a.ata));
    } catch (err: unknown) {
      const msg = Error(err);
      setStatus({ type: "error", message: msg, signature: "" });
    } finally {
      setIsScanning(false);
    }
  }, [connection, wallet.publicKey]);

  useEffect(() => {
    runScan();
  }, [runScan]);

  // Toggle checkbox
  function toggleAccount(ata: string) {
    setSelectedAtas((prev) =>
      prev.includes(ata)
        ? prev.filter((item) => item !== ata)
        : prev.length < MAX_BATCH
        ? [...prev, ata]
        : prev
    );
  }

  // Compute totals
  const activePool = tab === "empty" ? emptyList : dustList;
  const chosenItems = [...emptyList, ...dustList].filter((a) =>
    selectedAtas.includes(a.ata)
  );
  const grossSol = Number(
    chosenItems.reduce((sum, a) => sum + a.rentSol, 0).toFixed(5)
  );
  const netSol = Number((grossSol * (1 - FEE_RATE)).toFixed(5));

  // Execute reclaim
  async function handleReclaim() {
    if (chosenItems.length === 0) return;
    setIsReclaiming(true);
    setStatus({ type: "info", message: "Confirm in wallet...", signature: "" });

    try {
      const res = await reclaimSelectedAccounts(connection, wallet, chosenItems);
      setStatus({
        type: "success",
        message: `Reclaimed +${res.netSol} SOL!`,
        signature: res.signature,
      });
      setTimeout(runScan, 2000);
    } catch (err: unknown) {
      const msg = Error(err);
      setStatus({ type: "error", message: msg, signature: "" });
    } finally {
      setIsReclaiming(false);
    }
  }

  return {
    tab,
    setTab,
    activePool,
    emptyCount: emptyList.length,
    dustCount: dustList.length,
    selectedAtas,
    toggleAccount,
    selectBatch: () =>
      setSelectedAtas(activePool.slice(0, MAX_BATCH).map((a) => a.ata)),
    clearAll: () => setSelectedAtas([]),
    grossSol,
    netSol,
    isScanning,
    isReclaiming,
    status,
    runScan,
    handleReclaim,

  };
}
