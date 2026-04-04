import { getMagicEdenBaseUrl } from "@/lib/magiceden";

/** Magic Eden “offers received” payload shapes vary; we only need mints. */
function extractOffersArray(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object") {
    const o = data as Record<string, unknown>;
    if (Array.isArray(o.offers)) return o.offers;
    if (Array.isArray(o.results)) return o.results;
  }
  return [];
}

export async function fetchOffersReceivedMints(walletAddress: string): Promise<string[]> {
  const base = getMagicEdenBaseUrl();
  const url = `${base}/wallets/${encodeURIComponent(walletAddress)}/offers_received?limit=500`;
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    next: { revalidate: 120 },
  });
  if (!res.ok) return [];

  const data = (await res.json()) as unknown;
  const rows = extractOffersArray(data);
  const mints = new Set<string>();
  for (const row of rows) {
    if (!row || typeof row !== "object") continue;
    const m = (row as { tokenMint?: string; mint?: string }).tokenMint
      ?? (row as { mint?: string }).mint;
    if (typeof m === "string" && m.length >= 32) mints.add(m);
  }
  return [...mints];
}
