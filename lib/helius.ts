import type { NFT, NFTAttribute } from "@/types";

const DAS_METHOD = "getAssetsByOwner";

export interface HeliusAsset {
  id: string;
  interface?: string;
  content?: {
    metadata?: {
      name?: string;
      symbol?: string;
      attributes?: NFTAttribute[];
    };
    links?: { image?: string };
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

function pickImage(asset: HeliusAsset): string | null {
  const direct = asset.content?.links?.image;
  if (direct) return direct;

  const files = asset.content?.files;
  if (files?.length) {
    const preferred = files.find(
      (f) => f.mime?.startsWith("image/") || /\.(png|jpe?g|gif|webp|svg)(\?|$)/i.test(f.uri ?? "")
    );
    const f = preferred ?? files[0];
    const url = f?.cdn_uri || f?.uri;
    if (url) return url;
  }

  return null;
}

function pickName(asset: HeliusAsset): string {
  const metaName = asset.content?.metadata?.name?.trim();
  if (metaName) return metaName;
  return `${asset.id.slice(0, 4)}…${asset.id.slice(-4)}`;
}

export function mapHeliusAssetToNFT(asset: HeliusAsset): NFT {
  const meta = asset.content?.metadata;
  return {
    mint: asset.id,
    name: pickName(asset),
    collection: pickCollection(asset),
    image: pickImage(asset),
    symbol: meta?.symbol ?? null,
    attributes: Array.isArray(meta?.attributes) ? meta.attributes : [],
    owner: asset.ownership?.owner ?? "",
    compressed: Boolean(asset.compression?.compressed),
  };
}

function extractItems(json: unknown): HeliusAsset[] {
  if (!json || typeof json !== "object") return [];
  const o = json as { result?: unknown };
  const r = o.result;
  if (!r || typeof r !== "object") return [];
  const res = r as { items?: unknown };
  if (!Array.isArray(res.items)) return [];
  return res.items as HeliusAsset[];
}

export async function fetchAssetsByOwner(
  ownerAddress: string,
  rpcUrl: string
): Promise<NFT[]> {
  const body = {
    jsonrpc: "2.0",
    id: "solvault-das",
    method: DAS_METHOD,
    params: {
      ownerAddress,
      page: 1,
      limit: 1000,
      options: {
        showFungible: false,
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

  const items = extractItems(json);
  return items.map(mapHeliusAssetToNFT);
}
