"use client";

import type { NFT } from "@/types";
import { Button } from "@/components/ui/button";
import { useWalletStore } from "@/store/walletStore";
import { uniqueCollections, uniqueRarities } from "@/lib/nft-filters";
import { cn } from "@/lib/utils";

const panel =
  "rounded-xl border border-blue-800/50 bg-blue-950/90 p-4 text-solana-green shadow-md shadow-blue-950/30 backdrop-blur-sm";

const filterBtn =
  "border-blue-700/40 text-solana-green hover:bg-blue-900/50 hover:text-solana-green";

const filterBtnActive = "border-blue-500/60 bg-blue-900/70 text-solana-green hover:bg-blue-800/80 hover:text-solana-green";

interface FilterBarProps {
  nfts: NFT[];
}

export function FilterBar({ nfts }: FilterBarProps) {
  const filter = useWalletStore((s) => s.filter);
  const setFilter = useWalletStore((s) => s.setFilter);
  const cols = uniqueCollections(nfts);
  const rarities = uniqueRarities(nfts);

  return (
    <div className={panel}>
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-solana-green/80">
        Filters
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          className={cn(filterBtn, !filter.collection && filterBtnActive)}
          onClick={() => setFilter({ collection: undefined })}
        >
          All collections
        </Button>
        {cols.map((c) => (
          <Button
            key={c}
            type="button"
            size="sm"
            variant="outline"
            className={cn(filterBtn, filter.collection === c && filterBtnActive)}
            onClick={() => setFilter({ collection: c })}
          >
            {c}
          </Button>
        ))}
      </div>
      {rarities.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className={cn(filterBtn, !filter.rarity && filterBtnActive)}
            onClick={() => setFilter({ rarity: undefined })}
          >
            All rarities
          </Button>
          {rarities.map((r) => (
            <Button
              key={r}
              type="button"
              size="sm"
              variant="outline"
              className={cn(filterBtn, filter.rarity === r && filterBtnActive)}
              onClick={() => setFilter({ rarity: r })}
            >
              {r}
            </Button>
          ))}
        </div>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          className={cn(filterBtn, filter.hasImage === true && filterBtnActive)}
          onClick={() =>
            setFilter({ hasImage: filter.hasImage === true ? undefined : true })
          }
        >
          Has image
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="text-solana-green/80 hover:bg-blue-900/40 hover:text-solana-green"
          onClick={() => setFilter({ collection: undefined, rarity: undefined, hasImage: undefined })}
        >
          Clear filters
        </Button>
      </div>
    </div>
  );
}
