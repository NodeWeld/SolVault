import type { NFT } from "@/types";
import { labelForCollectionFilter } from "@/lib/nft-filters";

export const UNCATEGORIZED_COLLECTION_KEY = "__uncategorized__";

export type NftSortOrder = "none" | "nameAsc" | "nameDesc";
export type NftViewMode = "flat" | "collections";

export function collectionKey(nft: Pick<NFT, "collection">): string {
  return nft.collection ?? UNCATEGORIZED_COLLECTION_KEY;
}

export function sortNfts(nfts: NFT[], order: NftSortOrder): NFT[] {
  if (order === "none") return nfts;
  const mul = order === "nameAsc" ? 1 : -1;
  return [...nfts].sort(
    (a, b) => mul * a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
  );
}

export function filterNftsByFavoriteCollections(
  nfts: NFT[],
  favoriteKeys: string[],
  favoritesOnly: boolean
): NFT[] {
  if (!favoritesOnly) return nfts;
  if (!favoriteKeys.length) return [];
  const fav = new Set(favoriteKeys);
  return nfts.filter((n) => fav.has(collectionKey(n)));
}

export interface NftCollectionGroup {
  key: string;
  label: string;
  coverImage: string | null;
  items: NFT[];
}

function groupLabelForItems(items: NFT[]): string {
  if (!items.length) return "Empty";
  const first = items[0];
  if (first.collection == null) return "Uncategorized";
  return labelForCollectionFilter(items, first.collection);
}

export function groupNftsByCollection(
  nfts: NFT[],
  favoriteKeys: string[]
): NftCollectionGroup[] {
  const map = new Map<string, NFT[]>();
  for (const n of nfts) {
    const k = collectionKey(n);
    const arr = map.get(k) ?? [];
    arr.push(n);
    map.set(k, arr);
  }
  const favSet = new Set(favoriteKeys);
  const groups: NftCollectionGroup[] = [...map.entries()].map(([key, items]) => ({
    key,
    label: groupLabelForItems(items),
    coverImage: items.find((i) => i.image)?.image ?? null,
    items,
  }));
  groups.sort((a, b) => {
    const af = favSet.has(a.key) ? 0 : 1;
    const bf = favSet.has(b.key) ? 0 : 1;
    if (af !== bf) return af - bf;
    return a.label.localeCompare(b.label, undefined, { sensitivity: "base" });
  });
  return groups;
}
