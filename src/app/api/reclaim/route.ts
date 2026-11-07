import { NextResponse } from "next/server";
import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import {
  createBurnInstruction,
  createCloseAccountInstruction,
} from "@solana/spl-token";
import { RPC_URL, FEE_RATE, MAX_BATCH } from "@/config/constants";
import type { TokenAccountItem } from "@/services/reclaimService";

// treasury acc address 
const TREASURY_ADDRESS =
  process.env.TREASURY_WALLET || "F3FeCPujtrVpLyNynmXQTAM4okuvMmi9TyTFziMRaFyL";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const owner = new PublicKey(body.owner);
    const accounts: TokenAccountItem[] = (body.accounts || []).slice(0, MAX_BATCH);

    if (accounts.length === 0) {
      return NextResponse.json({ error: "No accounts selected." }, { status: 400 });
    }

    const connection = new Connection(RPC_URL, "confirmed");
    const transaction = new Transaction();
    let grossLamports = 0;

    for (const acc of accounts) {
      const ataPubkey = new PublicKey(acc.ata);
      const mintPubkey = new PublicKey(acc.mint);
      const progPubkey = new PublicKey(acc.programId);

      // Burn dust if non-empty
      if (!acc.isEmpty && BigInt(acc.rawBalance) > BigInt(0)) {
        transaction.add(
          createBurnInstruction(
            ataPubkey,
            mintPubkey,
            owner,
            BigInt(acc.rawBalance),
            [],
            progPubkey
          )
        );
      }

      // Close ATA (refunds rent)
      transaction.add(
        createCloseAccountInstruction(ataPubkey, owner, owner, [], progPubkey)
      );

      grossLamports += acc.rentLamports;
    }

    // Deduct 10% fee
    const feeLamports = Math.floor(grossLamports * FEE_RATE);
    if (feeLamports > 0) {
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: owner,
          toPubkey: new PublicKey(TREASURY_ADDRESS),
          lamports: feeLamports,
        })
      );
    }

    // Attach blockhash
    const { blockhash } = await connection.getLatestBlockhash("confirmed");
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = owner;

    // Serialize unsigned tx
    const serializedTx = transaction
      .serialize({ requireAllSignatures: false })
      .toString("base64");

    const netSol = Number(
      ((grossLamports - feeLamports) / LAMPORTS_PER_SOL).toFixed(5)
    );

    return NextResponse.json({ serializedTx, netSol });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
