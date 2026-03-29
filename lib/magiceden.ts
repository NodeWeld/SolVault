const DEFAULT_BASE = "https://api-mainnet.magiceden.dev/v2";

export function getMagicEdenBaseUrl(): string {
  return process.env.NEXT_PUBLIC_MAGIC_EDEN_API?.replace(/\/$/, "") ?? DEFAULT_BASE;
}

export interface MagicEdenCollectionStats {
  symbol?: string;
  floorPrice?: number;
}

export async function fetchCollectionFloor(symbol: string): Promise<number | null> {
  const base = getMagicEdenBaseUrl();
  const url = `${base}/collections/${encodeURIComponent(symbol)}`;
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    return null;
  }

  const data = (await res.json()) as MagicEdenCollectionStats & {
    results?: { floorPrice?: number };
  };

  if (typeof data.floorPrice === "number") return data.floorPrice;
  if (data.results && typeof data.results.floorPrice === "number") {
    return data.results.floorPrice;
  }
  return null;
}
