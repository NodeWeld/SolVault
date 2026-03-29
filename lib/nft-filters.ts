import type { NFT, NFTFilter } from "@/types";

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

export function uniqueCollections(nfts: NFT[]): string[] {
  const s = new Set<string>();
  for (const n of nfts) {
    if (n.collection) s.add(n.collection);
  }
  return [...s].sort();
}

export function uniqueRarities(nfts: NFT[]): string[] {
  const s = new Set<string>();
  for (const n of nfts) {
    const r = n.attributes.find((a) => a.trait_type.toLowerCase() === "rarity");
    if (r) s.add(String(r.value));
  }
  return [...s].sort();
}
