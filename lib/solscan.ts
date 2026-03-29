export function solscanTxUrl(signature: string): string {
  const net = process.env.NEXT_PUBLIC_SOLANA_NETWORK ?? "mainnet-beta";
  const base = "https://solscan.io/tx/";
  if (net === "mainnet-beta") return `${base}${signature}`;
  const cluster = net === "devnet" ? "devnet" : "testnet";
  return `${base}${signature}?cluster=${cluster}`;
}
