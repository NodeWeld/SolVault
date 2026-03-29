import type { NFT, NFTFilter } from "@/types";

export interface CollectionOption {
  id: string;
  label: string;
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
    return true;
  });
}

/** Unique collection ids with display labels for filter UI (filter value stays `id`). */
export function uniqueCollectionOptions(nfts: NFT[]): CollectionOption[] {
  const ids = new Set<string>();
  const bestName = new Map<string, string>();
  for (const n of nfts) {
    if (!n.collection) continue;
    ids.add(n.collection);
    const c = n.collectionName?.trim();
    if (!c) continue;
    const prev = bestName.get(n.collection);
    if (!prev || c.length > prev.length) bestName.set(n.collection, c);
  }
  const options: CollectionOption[] = [...ids].map((id) => ({
    id,
    label: bestName.get(id) ?? shortCollectionId(id),
  }));
  options.sort((a, b) =>
    a.label.localeCompare(b.label, undefined, { sensitivity: "base" })
  );
  return options;
}

export function uniqueRarities(nfts: NFT[]): string[] {
  const s = new Set<string>();
  for (const n of nfts) {
    const r = n.attributes.find((a) => a.trait_type.toLowerCase() === "rarity");
    if (r) s.add(String(r.value));
  }
  return [...s].sort();
}
