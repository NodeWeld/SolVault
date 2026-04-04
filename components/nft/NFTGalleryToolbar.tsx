"use client";

import { LayoutGrid, Rows3, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWalletStore } from "@/store/walletStore";
import type { NftSortOrder } from "@/lib/nft-gallery-utils";
import { cn } from "@/lib/utils";

export function NFTGalleryToolbar({ className }: { className?: string }) {
  const nftViewMode = useWalletStore((s) => s.nftViewMode);
  const setNftViewMode = useWalletStore((s) => s.setNftViewMode);
  const nftSortOrder = useWalletStore((s) => s.nftSortOrder);
  const setNftSortOrder = useWalletStore((s) => s.setNftSortOrder);
  const nftFavoritesOnly = useWalletStore((s) => s.nftFavoritesOnly);
  const setNftFavoritesOnly = useWalletStore((s) => s.setNftFavoritesOnly);
  const favoriteCollectionKeys = useWalletStore((s) => s.favoriteCollectionKeys);

  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-lg border border-border-subtle bg-surface/30 p-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between",
        className
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          View
        </span>
        <div className="flex rounded-md border border-border-subtle p-0.5">
          <Button
            type="button"
            size="sm"
            variant={nftViewMode === "flat" ? "secondary" : "ghost"}
            className="h-8 gap-1 px-2 text-xs"
            onClick={() => setNftViewMode("flat")}
          >
            <Rows3 className="h-3.5 w-3.5" aria-hidden />
            Flat
          </Button>
          <Button
            type="button"
            size="sm"
            variant={nftViewMode === "collections" ? "secondary" : "ghost"}
            className="h-8 gap-1 px-2 text-xs"
            onClick={() => setNftViewMode("collections")}
          >
            <LayoutGrid className="h-3.5 w-3.5" aria-hidden />
            Collections
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Sort
        </span>
        <select
          className="h-8 rounded-md border border-border-subtle bg-background/80 px-2 text-xs text-foreground"
          value={nftSortOrder}
          onChange={(e) => setNftSortOrder(e.target.value as NftSortOrder)}
          aria-label="Sort NFTs"
        >
          <option value="none">Default (load order)</option>
          <option value="nameAsc">Name A–Z</option>
          <option value="nameDesc">Name Z–A</option>
        </select>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant={nftFavoritesOnly ? "secondary" : "outline"}
          className="h-8 gap-1 text-xs"
          onClick={() => setNftFavoritesOnly(!nftFavoritesOnly)}
          disabled={!favoriteCollectionKeys.length}
          title={
            !favoriteCollectionKeys.length
              ? "Star collections in collection view first"
              : undefined
          }
        >
          <Star
            className={cn("h-3.5 w-3.5", nftFavoritesOnly && "fill-amber-400 text-amber-400")}
            aria-hidden
          />
          Favorites only
        </Button>
        {favoriteCollectionKeys.length ? (
          <span className="text-[10px] text-muted-foreground">
            {favoriteCollectionKeys.length} starred
          </span>
        ) : null}
      </div>
    </div>
  );
}
