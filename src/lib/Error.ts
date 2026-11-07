// Turns wallet and RPC errors into messages a normal user understands.
function rawMessage(err: unknown): string {
  const e = err as { message?: string; error?: { message?: string } } | undefined;
  return e?.error?.message || e?.message || String(err ?? "");
}

export function Error(err: unknown): string {
  const text = rawMessage(err).toLowerCase();

  if (text.includes("user rejected") || text.includes("rejected the request") || text.includes("declined")) {
    return "You cancelled the request in your wallet. Nothing was changed.";
  }
  if (text.includes("blockhash not found") || text.includes("block height exceeded") || text.includes("expired")) {
    return "The transaction took too long and expired. Click Reclaim again and approve faster.";
  }
  if (text.includes("insufficient") || text.includes("no record of a prior credit")) {
    return "Your wallet does not have enough SOL to pay the network fee. Add a little SOL and try again.";
  }
  if (text.includes("too large")) {
    return "Too many accounts for one transaction. Select fewer accounts and try again.";
  }
  if (text.includes("would fail") || text.includes("custom program error")) {
    return "One of the selected accounts cannot be closed right now. Deselect it and try again.";
  }
  if (text.includes("unexpected error")) {
    return "Your wallet could not process this transaction. Check that Phantom is on the same network as this site (Devnet needs Testnet Mode on), then try again.";
  }
  return "Something went wrong. Please try again. If it keeps happening, open an issue on GitHub.";
}