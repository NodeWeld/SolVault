/** Deep links to third-party marketplaces (read-only; listings live off-app). */

export function magicEdenItemUrl(mint: string): string {
  return `https://magiceden.io/item-details/${encodeURIComponent(mint)}`;
}

export function tensorTradeUrl(mint: string): string {
  return `https://www.tensor.trade/trade/solana/${encodeURIComponent(mint)}`;
}

export function hyperspaceTokenUrl(mint: string): string {
  return `https://hyperspace.xyz/token/${encodeURIComponent(mint)}`;
}
