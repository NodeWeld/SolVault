import { LAMPORTS_PER_SOL } from "@solana/web3.js";

export function shortAddr(address: string): string {
  const t = address.trim();
  if (t.length <= 12) return t;
  return `${t.slice(0, 4)}…${t.slice(-4)}`;
}

export function lamportsToSolDisplay(lamports: number): string {
  return (lamports / LAMPORTS_PER_SOL).toFixed(6);
}

export function feeLine(feeLamports: number | null): string {
  if (feeLamports != null) {
    return `Estimated network fee: ~${lamportsToSolDisplay(feeLamports)} SOL (${feeLamports.toLocaleString()} lamports).`;
  }
  return "Estimated network fee: ~0.000005 SOL (typical base fee; exact fee depends on the RPC quote and priority fees).";
}

export function computeLine(unitsConsumed?: number): string | null {
  if (unitsConsumed == null) return null;
  return `Compute units (simulation): ${unitsConsumed.toLocaleString()}.`;
}

export function buildSolTransferSummaryLines(opts: {
  amountSol: string;
  recipient: string;
  feeLamports: number | null;
  unitsConsumed?: number;
}): string[] {
  const r = opts.recipient.trim();
  const lines = [
    `You send ${opts.amountSol.trim()} SOL to ${shortAddr(r)}.`,
    `Recipient: ${r}`,
    feeLine(opts.feeLamports),
  ];
  const c = computeLine(opts.unitsConsumed);
  if (c) lines.push(c);
  lines.push("Your SOL balance will decrease by the amount above plus the fee.");
  return lines;
}

export function buildNftTransferSummaryLines(opts: {
  name: string;
  mint: string;
  recipient: string;
  compressed: boolean;
  feeLamports: number | null;
  unitsConsumed?: number;
  simulated: boolean;
}): string[] {
  const r = opts.recipient.trim();
  const lines: string[] = [
    opts.compressed
      ? `Transfer compressed NFT “${opts.name}” to ${shortAddr(r)}.`
      : `Transfer 1 NFT (“${opts.name}”) to ${shortAddr(r)}.`,
    `Mint: ${opts.mint}`,
    `Recipient: ${r}`,
  ];
  if (opts.simulated) {
    lines.push(feeLine(opts.feeLamports));
    const c = computeLine(opts.unitsConsumed);
    if (c) lines.push(c);
  } else {
    lines.push(
      "Metaplex Bubblegum will build the transaction when you sign; fee and compute are shown in your wallet."
    );
  }
  lines.push("You will no longer hold this NFT in this wallet after it confirms.");
  return lines;
}

export function buildSplTransferSummaryLines(opts: {
  symbol: string;
  mint: string;
  amountUi: string;
  recipient: string;
  feeLamports: number | null;
  unitsConsumed?: number;
}): string[] {
  const r = opts.recipient.trim();
  const lines = [
    `Send ${opts.amountUi.trim()} ${opts.symbol} to ${shortAddr(r)}.`,
    `Token mint: ${opts.mint}`,
    `Recipient: ${r}`,
    feeLine(opts.feeLamports),
  ];
  const c = computeLine(opts.unitsConsumed);
  if (c) lines.push(c);
  lines.push("Your token account balance will decrease by that amount.");
  return lines;
}

export function buildBatchNftSummaryLines(opts: {
  totalNfts: number;
  txCount: number;
  recipient: string;
  feeLamports: number | null;
  unitsConsumed?: number;
}): string[] {
  const r = opts.recipient.trim();
  const lines = [
    `Send ${opts.totalNfts} NFT(s) to ${shortAddr(r)} in ${opts.txCount} separate transaction(s) (up to 5 NFTs each).`,
    `Recipient: ${r}`,
    "First batch only was simulated below; later batches may use similar fees.",
    feeLine(opts.feeLamports),
  ];
  const c = computeLine(opts.unitsConsumed);
  if (c) lines.push(c);
  return lines;
}
