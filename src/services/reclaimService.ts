import { Buffer } from "buffer";
import { Connection, PublicKey, Transaction, LAMPORTS_PER_SOL,  VersionedTransaction } from "@solana/web3.js";
import { WalletContextState } from "@solana/wallet-adapter-react";
import { TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";

// polyfill
if (typeof window !== "undefined") {
  (window as unknown as { Buffer: typeof Buffer }).Buffer ||= Buffer;
}

export interface TokenAccountItem {
  ata: string;
  mint: string;
  programId: string;
  label: "SPL" | "Token-2022";
  rawBalance: string;
  uiBalance: number;
  rentLamports: number;
  rentSol: number;
  isEmpty: boolean;
}

// Parse RPC response
function formatAccounts(
  rawList: Awaited<ReturnType<Connection["getParsedTokenAccountsByOwner"]>>["value"],
  programId: PublicKey,
  label: "SPL" | "Token-2022"
): TokenAccountItem[] {
  const result: TokenAccountItem[] = [];

  for (const item of rawList) {
    const info = item.account.data.parsed?.info;
    if (!info || info.state === "frozen") continue;

    const rawBalance = String(info.tokenAmount?.amount ?? "0");
    const rentLamports = item.account.lamports;

    result.push({
      ata: item.pubkey.toBase58(),
      mint: info.mint,
      programId: programId.toBase58(),
      label,
      rawBalance,
      uiBalance: Number(info.tokenAmount?.uiAmount ?? 0),
      rentLamports,
      rentSol: Number((rentLamports / LAMPORTS_PER_SOL).toFixed(5)),
      isEmpty: rawBalance === "0",
    });
  }

  return result;
}

//  Scan wallet
export async function scanWalletAccounts(
  connection: Connection,
  owner: PublicKey
): Promise<{ emptyList: TokenAccountItem[]; dustList: TokenAccountItem[] }> {
  const [spl, t22] = await Promise.all([
    connection.getParsedTokenAccountsByOwner(owner, { programId: TOKEN_PROGRAM_ID }),
    connection.getParsedTokenAccountsByOwner(owner, { programId: TOKEN_2022_PROGRAM_ID }),
  ]);

  const all = [
    ...formatAccounts(spl.value, TOKEN_PROGRAM_ID, "SPL"),
    ...formatAccounts(t22.value, TOKEN_2022_PROGRAM_ID, "Token-2022"),
  ];

  return {
    emptyList: all.filter((a) => a.isEmpty),
    dustList: all.filter((a) => !a.isEmpty),
  };
}

// 2. Request server tx & sign
export async function reclaimSelectedAccounts(
  connection: Connection,
  wallet: WalletContextState,
  selected: TokenAccountItem[]
): Promise<{ signature: string; netSol: number }> {
  if (!wallet.publicKey) throw new Error("Connect wallet first.");

  const res = await fetch("/api/reclaim", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      owner: wallet.publicKey.toBase58(),
      accounts: selected,
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to build transaction.");

  // Deserialize server tx
  const txBuffer = Buffer.from(data.serializedTx, "base64");
  const transaction = Transaction.from(txBuffer);






    // Simulate first: gives real program logs if the tx would fail
  const simTx = new VersionedTransaction(transaction.compileMessage());
  const sim = await connection.simulateTransaction(simTx, {
    sigVerify: false, // the user has not signed yet
    replaceRecentBlockhash: true, // avoids a false "expired" result
  });
  if (sim.value.err) {
    console.warn("Simulation logs:", sim.value.logs);
    throw new Error("Transaction would fail: " + JSON.stringify(sim.value.err));
  }

  // Sign via wallet
  let signature: string;
  try {
    signature = await wallet.sendTransaction(transaction, connection);
  } catch (e) {
    // The adapter hides the real reason in e.error
    const inner = (e as { error?: { message?: string } }).error?.message;
    console.warn("Wallet error:", e);
    throw new Error(inner || (e instanceof Error ? e.message : "Wallet rejected the transaction."));
  }
  return { signature, netSol: data.netSol };}