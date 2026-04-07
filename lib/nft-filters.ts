import type { NFT, NFTFilter } from "@/types";

export interface CollectionOption {
  id: string;
  label: string;
  /** NFTs in this wallet load belonging to this collection id. */
  count: number;
}

export function shortCollectionId(id: string): string {
  if (id.length <= 14) return id;
  return `${id.slice(0, 4)}…${id.slice(-4)}`;
}

/** Label for cards / lists: prefer resolved name, else shortened id, else uncategorized. */
export function collectionDisplayLabel(nft: Pick<NFT, "collection" | "collectionName">): string {
  const name = nft.collectionName?.trim();
  if (name) return name;
  if (nft.collection) return shortCollectionId(nft.collection);
  return "Uncategorized";
}

export function labelForCollectionFilter(nfts: NFT[], collectionId: string): string {
  let best: string | null = null;
  for (const n of nfts) {
    if (n.collection !== collectionId) continue;
    const c = n.collectionName?.trim();
    if (c && (!best || c.length > best.length)) best = c;
  }
  return best ?? shortCollectionId(collectionId);
}

export function applyNFTFilters(nfts: NFT[], filter: NFTFilter): NFT[] {
  const q = filter.search?.trim().toLowerCase();
  return nfts.filter((n) => {
    if (filter.collection && (n.collection ?? "") !== filter.collection) return false;
    if (filter.hasImage === true && !n.image) return false;
    if (filter.rarity) {
      const r = n.attributes.find(
        (a) => a.trait_type.toLowerCase() === "rarity"
      )?.value;
      const rs = r == null ? "" : String(r);
      if (rs !== filter.rarity) return false;
    }
    if (q) {
      const hay = [
        n.name,
        n.mint,
        n.symbol ?? "",
        n.collectionName ?? "",
        n.collection ?? "",
      ]
        .join(" ")
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

/** Unique collection ids with display labels for filter UI (filter value stays `id`). */
export function uniqueCollectionOptions(nfts: NFT[]): CollectionOption[] {
  const ids = new Set<string>();
  const bestName = new Map<string, string>();
  const counts = new Map<string, number>();
  for (const n of nfts) {
    if (!n.collection) continue;
    ids.add(n.collection);
    counts.set(n.collection, (counts.get(n.collection) ?? 0) + 1);
    const c = n.collectionName?.trim();
    if (!c) continue;
    const prev = bestName.get(n.collection);
    if (!prev || c.length > prev.length) bestName.set(n.collection, c);
  }
  const options: CollectionOption[] = [...ids].map((id) => ({
    id,
    label: bestName.get(id) ?? shortCollectionId(id),
    count: counts.get(id) ?? 0,
  }));
  options.sort((a, b) =>
    a.label.localeCompare(b.label, undefined, { sensitivity: "base" })
  );
  return options;
}

/**
 * Primary title + optional edition for cards: strips trailing `#123` from name when present,
 * otherwise checks common metadata traits.
 */
export function nftCardDisplayParts(nft: NFT): {
  title: string;
  collectionLine: string;
} {
  const name = nft.name.trim();
  const hashEnd = name.match(/^(.+?)\s*#(\d+)\s*$/);
  let title = name;
  let editionToken: string | null = null;
  if (hashEnd) {
    const base = hashEnd[1].trim();
    title = base || name;
    editionToken = `#${hashEnd[2]}`;
  } else {
    const traitKeys = ["edition", "edition number", "token id", "mint number", "#", "number"];
    for (const k of traitKeys) {
      const a = nft.attributes.find((t) => t.trait_type.toLowerCase() === k);
      if (a == null) continue;
      const v = String(a.value).trim();
      if (!v) continue;
      editionToken = /^\d+$/.test(v) ? `#${v}` : v;
      break;
    }
  }

  const col = collectionDisplayLabel(nft);
  const collectionLine = editionToken ? `${col} · ${editionToken}` : col;

  return { title, collectionLine };
}

export function uniqueRarities(nfts: NFT[]): string[] {
  const s = new Set<string>();
  for (const n of nfts) {
    const r = n.attributes.find((a) => a.trait_type.toLowerCase() === "rarity");
    if (r) s.add(String(r.value));
  }
  return [...s].sort();
}
