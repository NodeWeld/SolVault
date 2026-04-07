import { normalizeNftImageUrl } from "@/lib/helius";

/** Extract IPFS content id from common URL shapes. */
function extractIpfsCid(url: string): string | null {
  const t = url.trim();
  if (t.startsWith("ipfs://")) {
    const rest = t.slice("ipfs://".length).replace(/^\/+/, "").replace(/^ipfs\//, "");
    const first = rest.split("/")[0];
    return first || null;
  }
  const m = t.match(/\/ipfs\/([^/?#]+)/i);
  if (m?.[1]) return m[1].split("/")[0] || m[1];
  return null;
}

/**
 * Ordered URLs to try in `<img>` (primary + IPFS gateway fallbacks).
 * Many gateways rate-limit or fail; cycling `onError` fixes broken thumbnails.
 */
export function nftImageUrlCandidates(raw: string | null | undefined): string[] {
  const u = normalizeNftImageUrl(raw);
  if (!u) return [];

  const cid = extractIpfsCid(u);
  if (cid) {
    const gateways = [
      `https://cloudflare-ipfs.com/ipfs/${cid}`,
      `https://ipfs.io/ipfs/${cid}`,
      `https://nftstorage.link/ipfs/${cid}`,
      `https://gateway.pinata.cloud/ipfs/${cid}`,
      `https://dweb.link/ipfs/${cid}`,
    ];
    const merged = [...gateways, u];
    return [...new Set(merged)];
  }

  return [u];
}
