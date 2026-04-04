import { Connection, clusterApiUrl } from "@solana/web3.js";

/** Accepts common typos like `devnet-beta` → `devnet` for cluster APIs. */
export function normalizeSolanaCluster(
  raw?: string | null
): "mainnet-beta" | "devnet" | "testnet" {
  const n = (raw ?? "mainnet-beta").trim().toLowerCase().replace(/_/g, "-");
  if (n === "mainnet" || n === "mainnet-beta") return "mainnet-beta";
  if (n === "devnet" || n === "devnet-beta") return "devnet";
  if (n === "testnet") return "testnet";
  return "mainnet-beta";
}

/** Host segment for `https://{here}.helius-rpc.com` */
function heliusClusterSegment(cluster: "mainnet-beta" | "devnet" | "testnet"): string {
  if (cluster === "mainnet-beta") return "mainnet";
  return cluster;
}

export function getRpcUrl(): string {
  const url = process.env.NEXT_PUBLIC_RPC_URL?.trim();
  if (url && url.length > 0) return url;
  const network = normalizeSolanaCluster(process.env.NEXT_PUBLIC_SOLANA_NETWORK);
  return clusterApiUrl(network);
}

export function createConnection(commitment: "processed" | "confirmed" | "finalized" = "confirmed") {
  return new Connection(getRpcUrl(), commitment);
}

/**
 * RPC URL used for Helius DAS (`getAssetsByOwner`). Public Solana RPC endpoints
 * do not implement this method — you need a Helius URL with `api-key` and/or
 * `HELIUS_API_KEY` / `NEXT_PUBLIC_HELIUS_API_KEY`.
 */
export function getHeliusDasRpcUrl(): string {
  const cluster = normalizeSolanaCluster(process.env.NEXT_PUBLIC_SOLANA_NETWORK);
  const heliusHost = heliusClusterSegment(cluster);

  const serverKey =
    process.env.HELIUS_API_KEY?.trim() || process.env.SOLANA_HELIUS_API_KEY?.trim();
  const publicKey = process.env.NEXT_PUBLIC_HELIUS_API_KEY?.trim();
  const key = serverKey || publicKey;

  const explicitRpc = process.env.NEXT_PUBLIC_RPC_URL?.trim();

  if (key) {
    return `https://${heliusHost}.helius-rpc.com/?api-key=${encodeURIComponent(key)}`;
  }

  if (explicitRpc) {
    if (explicitRpc.includes("helius-rpc.com")) {
      const u = explicitRpc.toLowerCase();
      if (u.includes("api-key=") && (u.includes("api-key=&") || u.endsWith("api-key="))) {
        throw new Error(
          "NEXT_PUBLIC_RPC_URL points to Helius but the api-key looks empty. Set your real key in the URL or set HELIUS_API_KEY / NEXT_PUBLIC_HELIUS_API_KEY."
        );
      }
      if (u.includes("your_helius") || u.includes("placeholder")) {
        throw new Error(
          "Replace the placeholder in NEXT_PUBLIC_RPC_URL with your Helius API key, or set HELIUS_API_KEY."
        );
      }
      return explicitRpc;
    }
    const isPublicSolanaRpc =
      explicitRpc.includes("solana.com") ||
      explicitRpc.includes("rpc.ankr.com") ||
      explicitRpc.includes("alchemy.com");
    if (isPublicSolanaRpc) {
      throw new Error(
        "NFT loading uses Helius DAS (getAssetsByOwner). Your NEXT_PUBLIC_RPC_URL is a public RPC that does not support DAS. Set HELIUS_API_KEY or NEXT_PUBLIC_HELIUS_API_KEY, or use a Helius URL with api-key (match NEXT_PUBLIC_SOLANA_NETWORK to your wallet: mainnet vs devnet)."
      );
    }
    return explicitRpc;
  }

  const fallback = clusterApiUrl(cluster);
  throw new Error(
    `NFT loading requires Helius. Set HELIUS_API_KEY (server) or NEXT_PUBLIC_HELIUS_API_KEY, or NEXT_PUBLIC_RPC_URL to https://${heliusHost}.helius-rpc.com/?api-key=YOUR_KEY. Use NEXT_PUBLIC_SOLANA_NETWORK=devnet or mainnet-beta. Plain ${fallback} does not support DAS.`
  );
}

/** @deprecated use getHeliusDasRpcUrl — kept for any import compatibility */
export function getHeliusRpcUrl(): string {
  return getHeliusDasRpcUrl();
}
