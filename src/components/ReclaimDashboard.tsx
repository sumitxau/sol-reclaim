"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useReclaim } from "@/hooks/useReclaim";
import { FEE_RATE, MAX_BATCH, RPC_URL } from "@/config/constants";

export function ReclaimDashboard() {
  const { publicKey } = useWallet();
  const { setVisible } = useWalletModal();
  const {
    tab, setTab, activePool, emptyCount, dustCount, selectedAtas,
    toggleAccount, selectBatch, clearAll, grossSol, netSol,
    isScanning, isReclaiming, status, runScan, handleReclaim,
  } = useReclaim();

  // Burn confirmation (only used on the "with tokens" tab)
  const [ack, setAck] = useState(false);

  const cluster = RPC_URL.includes("devnet") ? "?cluster=devnet" : "";
  const feePct = Math.round(FEE_RATE * 100);
  const isDust = tab === "dust";
  const needsAck = isDust && !ack;
  const feeSol = Number((grossSol - netSol).toFixed(5));
  const poolTotal = Number(activePool.reduce((s, a) => s + a.rentSol, 0).toFixed(5));
  const progress = Math.min(100, (selectedAtas.length / MAX_BATCH) * 100);
  const canReclaim = !!publicKey && selectedAtas.length > 0 && !isReclaiming && !needsAck;

  let buttonLabel = `Reclaim +${netSol} SOL`;
  if (!publicKey) buttonLabel = "Connect wallet first";
  else if (isReclaiming) buttonLabel = "Waiting for wallet…";
  else if (selectedAtas.length === 0) buttonLabel = "Select accounts first";
  else if (needsAck) buttonLabel = "Confirm the warning first";

  function switchTab(next: "empty" | "dust") {
    setTab(next);
    clearAll();
    setAck(false);
  }

  async function onReclaim() {
    await handleReclaim();
    setAck(false);
  }

  return (
    <section id="app" className="workspace">
      <div className="workspace-grid">
        {/* LEFT: account list */}
        <div className="panel">
          <div className="panel-head">
            <div>
              <h2 className="panel-title">Your token accounts</h2>
              <p className="panel-sub">
                {publicKey
                  ? `${activePool.length} accounts in this tab · ${poolTotal} SOL locked`
                  : "Connect a wallet to scan"}
              </p>
            </div>
            <button type="button" onClick={runScan} disabled={!publicKey || isScanning} className="btn btn-outline btn-sm">
              {isScanning ? "Scanning…" : "Rescan"}
            </button>
          </div>

          <div className="segmented">
            <button type="button" onClick={() => switchTab("empty")} className={`segment ${tab === "empty" ? "segment-active" : ""}`}>
              Empty accounts <span className="count">{emptyCount}</span>
            </button>
            <button type="button" onClick={() => switchTab("dust")} className={`segment ${isDust ? "segment-active" : ""}`}>
              Accounts with tokens <span className="count">{dustCount}</span>
            </button>
          </div>

          {isDust ? (
            <div className="note note-warn">
              Warning: these accounts still hold tokens. Closing them burns the tokens
              first. Burned tokens are gone forever. Check every row.
            </div>
          ) : (
            <div className="note note-safe">
              Safe: these accounts hold zero tokens. Closing them only returns the rent.
            </div>
          )}

          <div className="toolbar">
            <div className="toolbar-left">
              <span className="field-label">{selectedAtas.length} of {MAX_BATCH} selected</span>
              <div className="progress"><span style={{ width: `${progress}%` }} /></div>
            </div>
            <div className="toolbar-actions">
              <button type="button" onClick={selectBatch} disabled={activePool.length === 0} className="btn btn-outline btn-sm">
                Select {MAX_BATCH}
              </button>
              <button type="button" onClick={clearAll} disabled={selectedAtas.length === 0} className="btn btn-outline btn-sm">
                Clear
              </button>
            </div>
          </div>

          <div className="account-list">
            {!publicKey ? (
              <div className="empty-state">
                <span className="empty-title">No wallet connected</span>
                <span>Connect Phantom or Solflare to find your locked SOL.</span>
                <button type="button" onClick={() => setVisible(true)} className="btn btn-primary">
                  Connect wallet
                </button>
              </div>
            ) : isScanning ? (
              <div className="empty-state">Scanning your wallet…</div>
            ) : activePool.length === 0 ? (
              <div className="empty-state">
                <span className="empty-title">Nothing here</span>
                <span>No accounts found in this tab.</span>
              </div>
            ) : (
              activePool.map((acc) => {
                const checked = selectedAtas.includes(acc.ata);
                return (
                  <label key={acc.ata} className={`account-row ${checked ? "account-row-selected" : ""}`}>
                    <div className="account-left">
                      <input type="checkbox" checked={checked} onChange={() => toggleAccount(acc.ata)} />
                      <span className="avatar">{acc.mint.slice(0, 2).toUpperCase()}</span>
                      <div className="account-meta">
                        <span className="account-mint">
                          {acc.mint.slice(0, 4)}…{acc.mint.slice(-4)}
                          <a
                            href={`https://solscan.io/token/${acc.mint}${cluster}`}
                            target="_blank"
                            rel="noreferrer"
                            className="link-ext"
                            title="View token on Solscan"
                          >
                            ↗
                          </a>
                        </span>
                        <span className="account-sub">
                          <span className="tag">{acc.label}</span>
                          {!acc.isEmpty && `Balance: ${acc.uiBalance}`}
                        </span>
                      </div>
                    </div>
                    <span className="account-rent">+{acc.rentSol} SOL</span>
                  </label>
                );
              })
            )}
          </div>

          {activePool.length > MAX_BATCH && (
            <p className="fineprint" style={{ marginTop: 12 }}>
              Solana limits the size of one transaction, so you reclaim up to {MAX_BATCH} accounts
              at a time. After it confirms, click Rescan and repeat for the rest.
            </p>
          )}
        </div>

        {/* RIGHT: sticky summary */}
        <aside className="panel summary-panel">
          <div>
            <span className="field-label">You receive</span>
            <div className="summary-big">
              +{netSol} <small>SOL</small>
            </div>
          </div>

          <div className="receipt">
            <div className="receipt-row"><span>Accounts to close</span><span>{selectedAtas.length}</span></div>
            <div className="receipt-row"><span>Rent unlocked</span><span>{grossSol} SOL</span></div>
            <div className="receipt-row"><span>Service fee ({feePct}%)</span><span>-{feeSol} SOL</span></div>
          </div>

          {isDust && (
            <label className="check-row">
              <input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} />
              <span>I understand the tokens in these accounts will be destroyed and cannot be recovered.</span>
            </label>
          )}

          <button type="button" onClick={onReclaim} disabled={!canReclaim} className="btn btn-primary btn-block">
            {buttonLabel}
          </button>

          {status.message && (
            <div className={`status-box status-${status.type}`}>
              <p>{status.message}</p>
              {status.signature && (
                <div className="explorer-links">
                  <a href={`https://solscan.io/tx/${status.signature}${cluster}`} target="_blank" rel="noreferrer">
                    View transaction on Solscan ↗
                  </a>
                </div>
              )}
            </div>
          )}

          <p className="fineprint">
            You approve the transaction in your own wallet. SolReclaim never holds your SOL or your keys.
          </p>
        </aside>
      </div>
    </section>
  );
}