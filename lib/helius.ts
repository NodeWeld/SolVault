import type { NFT, NFTAttribute } from "@/types";

const DAS_METHOD = "getAssetsByOwner";

export interface HeliusAsset {
  id: string;
  interface?: string;
  /** Present when DAS `showCollectionMetadata` is enabled. */
  collection?: { name?: string; symbol?: string; image?: string };
  content?: {
    metadata?: {
      name?: string;
      symbol?: string;
      /** Metaplex off-chain JSON `image` field; DAS often inlines it here. */
      image?: string;
      attributes?: NFTAttribute[];
      /** On-chain JSON: `{ name, family }` or `{ key, verified }`. */
      collection?: unknown;
      family?: string;
    };
    links?: { image?: string; thumbnail?: string };
    json_uri?: string;
    files?: { uri?: string; cdn_uri?: string; mime?: string }[];
    $schema?: string;
  };
  grouping?: { group_key?: string; group_value?: string }[];
  ownership?: { owner?: string };
  compression?: { compressed?: boolean };
}

export interface GetAssetsByOwnerResult {
  items: HeliusAsset[];
  total?: number;
  limit?: number;
  page?: number;
}

function pickCollection(asset: HeliusAsset): string | null {
  const g = asset.grouping;
  if (!g?.length) return null;
  const col = g.find((x) => x.group_key === "collection");
  return col?.group_value ?? null;
}

/** Make `ipfs://` / `ar://` URLs usable in `<img src>` (browsers do not load those schemes). */
export function normalizeNftImageUrl(raw: string | null | undefined): string | null {
  if (raw == null) return null;
  const u = raw.trim();
  if (!u) return null;
  if (u.startsWith("ipfs://")) {
    const rest = u.slice("ipfs://".length).replace(/^\/+/, "");
    const path = rest.replace(/^ipfs\//, "");
    return `https://ipfs.io/ipfs/${path}`;
  }
  if (u.startsWith("ar://")) {
    const id = u.slice("ar://".length).replace(/^\/+/, "");
    return `https://arweave.net/${id}`;
  }
  return u;
}

function pickCollectionName(asset: HeliusAsset): string | null {
  const fromDas = asset.collection?.name?.trim();
  if (fromDas) return fromDas;

  const mc = asset.content?.metadata?.collection;
  if (mc && typeof mc === "object" && mc !== null) {
    const n = (mc as Record<string, unknown>).name;
    if (typeof n === "string" && n.trim()) return n.trim();
  }

  const fam = asset.content?.metadata?.family;
  if (typeof fam === "string" && fam.trim()) return fam.trim();

  return null;
}

function pickImage(asset: HeliusAsset): string | null {
  const links = asset.content?.links;
  const fromLink =
    normalizeNftImageUrl(links?.image) ?? normalizeNftImageUrl(links?.thumbnail);
  if (fromLink) return fromLink;

  const metaImg = asset.content?.metadata?.image;
  if (typeof metaImg === "string") {
    const n = normalizeNftImageUrl(metaImg);
    if (n) return n;
  }

  const files = asset.content?.files;
  if (files?.length) {
    const isImageFile = (f: { uri?: string; cdn_uri?: string; mime?: string }) => {
      const ref = f.uri ?? f.cdn_uri ?? "";
      return (
        f.mime?.startsWith("image/") ||
        /\.(png|jpe?g|gif|webp|svg|avif)(\?|$)/i.test(ref)
      );
    };
    const preferred = files.find(isImageFile);
    const f = preferred ?? files[0];
    const url = f?.cdn_uri || f?.uri;
    const n = normalizeNftImageUrl(url);
    if (n) return n;
  }

  return null;
}

function pickName(asset: HeliusAsset): string {
  const metaName = asset.content?.metadata?.name?.trim();
  if (metaName) return metaName;
  return `${asset.id.slice(0, 4)}…${asset.id.slice(-4)}`;
}

export function mapHeliusAssetToNFT(asset: HeliusAsset): NFT | null {
  try {
    if (!asset?.id || typeof asset.id !== "string" || asset.id.length < 32) {
      return null;
    }
    const meta = asset.content?.metadata;
    return {
      mint: asset.id,
      name: pickName(asset),
      collection: pickCollection(asset),
      collectionName: pickCollectionName(asset),
      image: pickImage(asset),
      symbol: meta?.symbol ?? null,
      attributes: Array.isArray(meta?.attributes) ? meta.attributes : [],
      owner: asset.ownership?.owner ?? "",
      compressed: Boolean(asset.compression?.compressed),
    };
  } catch {
    return null;
  }
}

export const HELIUS_NFT_PAGE_SIZE = 100;

function parseDasResult(json: unknown): {
  items: HeliusAsset[];
  page: number;
  limit: number;
  total?: number;
} {
  if (!json || typeof json !== "object") {
    return { items: [], page: 1, limit: HELIUS_NFT_PAGE_SIZE };
  }
  const o = json as { result?: unknown };
  const r = o.result;
  if (!r || typeof r !== "object") {
    return { items: [], page: 1, limit: HELIUS_NFT_PAGE_SIZE };
  }
  const res = r as {
    items?: unknown;
    page?: unknown;
    limit?: unknown;
    total?: unknown;
  };
  const items = Array.isArray(res.items) ? (res.items as HeliusAsset[]) : [];
  const page = typeof res.page === "number" && res.page >= 1 ? res.page : 1;
  const limit =
    typeof res.limit === "number" && res.limit > 0 ? res.limit : HELIUS_NFT_PAGE_SIZE;
  const total = typeof res.total === "number" && res.total >= 0 ? res.total : undefined;
  return { items, page, limit, total };
}

async function postDas(ownerAddress: string, rpcUrl: string, page: number, limit: number) {
  const body = {
    jsonrpc: "2.0",
    id: "solvault-das",
    method: DAS_METHOD,
    params: {
      ownerAddress,
      page,
      limit,
      options: {
        showFungible: false,
        showCollectionMetadata: true,
      },
    },
  };

  const res = await fetch(rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const rawText = await res.text();
  let json: unknown;
  try {
    json = JSON.parse(rawText) as unknown;
  } catch {
    throw new Error(`Helius DAS: invalid JSON (${res.status}): ${rawText.slice(0, 200)}`);
  }

  if (!res.ok) {
    throw new Error(`Helius DAS HTTP ${res.status}: ${rawText.slice(0, 300)}`);
  }

  const errObj = json as { error?: { message?: string; code?: number } };
  if (errObj.error?.message) {
    throw new Error(
      `Helius DAS: ${errObj.error.message}${errObj.error.code != null ? ` (code ${errObj.error.code})` : ""}`
    );
  }

  return parseDasResult(json);
}

export interface FetchNftsPageResult {
  nfts: NFT[];
  page: number;
  limit: number;
  total?: number;
}

export async function fetchAssetsByOwnerPage(
  ownerAddress: string,
  rpcUrl: string,
  page: number = 1,
  limit: number = HELIUS_NFT_PAGE_SIZE
): Promise<FetchNftsPageResult> {
  const safePage = Math.max(1, Math.floor(page));
  const safeLimit = Math.min(1000, Math.max(1, Math.floor(limit)));
  const { items, page: p, limit: l, total } = await postDas(
    ownerAddress,
    rpcUrl,
    safePage,
    safeLimit
  );
  const nfts = items
    .map(mapHeliusAssetToNFT)
    .filter((n): n is NFT => n !== null);

  return {
    nfts,
    page: p,
    limit: l,
    total,
  };
}

/** @deprecated Prefer paginated `fetchAssetsByOwnerPage`; kept for one-shot callers. */
export async function fetchAssetsByOwner(ownerAddress: string, rpcUrl: string): Promise<NFT[]> {
  const { nfts } = await fetchAssetsByOwnerPage(ownerAddress, rpcUrl, 1, 1000);
  return nfts;
}
