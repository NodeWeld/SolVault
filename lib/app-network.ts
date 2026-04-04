import { normalizeSolanaCluster } from "@/lib/solana";

export type AppCluster = "mainnet-beta" | "devnet" | "testnet";

/** Cluster from `NEXT_PUBLIC_SOLANA_NETWORK` (browser-safe). */
export function getConfiguredCluster(): AppCluster {
  if (typeof window === "undefined") {
    return normalizeSolanaCluster(process.env.NEXT_PUBLIC_SOLANA_NETWORK);
  }
  return normalizeSolanaCluster(process.env.NEXT_PUBLIC_SOLANA_NETWORK);
}

/** Short label for chips and badges. */
export function clusterShortLabel(cluster: AppCluster): string {
  if (cluster === "mainnet-beta") return "Mainnet";
  if (cluster === "devnet") return "Devnet";
  return "Testnet";
}

/** User-facing sentence for settings / banners. */
export function clusterHintSentence(cluster: AppCluster): string {
  const name = clusterShortLabel(cluster);
  return `This app is connected to Solana ${name}. Your wallet must use the same network or balances and NFTs may not match.`;
}
