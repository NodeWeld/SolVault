"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Star } from "lucide-react";
import type { NFT } from "@/types";
import type { NftCollectionGroup } from "@/lib/nft-gallery-utils";
import { NFTVirtualizedGrid } from "@/components/nft/NFTVirtualizedGrid";
import { Button } from "@/components/ui/button";
import { useWalletStore } from "@/store/walletStore";
import { cn } from "@/lib/utils";
import { NftImage } from "@/components/nft/NftImage";

function CollectionDetails({
  starred,
  itemCount,
  children,
}: {
  starred: boolean;
  itemCount: number;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(starred || itemCount <= 18);
  useEffect(() => {
    setOpen(starred || itemCount <= 18);
  }, [starred, itemCount]);

  return (
    <details
      className="group rounded-xl border border-border-subtle bg-black/20 open:border-solana-purple/35"
      open={open}
      onToggle={(e) => setOpen(e.currentTarget.open)}
    >
      {children}
    </details>
  );
}

interface NFTCollectionsViewProps {
  groups: NftCollectionGroup[];
  loading?: boolean;
  onOpen: (nft: NFT) => void;
  selectionEnabled?: boolean;
  onLoadMore?: () => void;
  hasMoreNfts?: boolean;
  loadingMoreNfts?: boolean;
  offerMintSet?: Set<string>;
}

export function NFTCollectionsView({
  groups,
  loading,
  onOpen,
  selectionEnabled,
  onLoadMore,
  hasMoreNfts,
  loadingMoreNfts,
  offerMintSet,
}: NFTCollectionsViewProps) {
  const favoriteCollectionKeys = useWalletStore((s) => s.favoriteCollectionKeys);
  const toggleFavoriteCollection = useWalletStore((s) => s.toggleFavoriteCollection);

  if (loading) {
    return (
      <NFTVirtualizedGrid
        nfts={[]}
        loading
        onOpen={onOpen}
        selectionEnabled={selectionEnabled}
      />
    );
  }

  if (!groups.length) {
    return (
      <div className="rounded-xl border border-dashed border-border-subtle bg-surface/40 p-12 text-center text-sm text-muted-foreground">
        No NFTs found for this wallet with the current filters.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {groups.map((g) => {
        const starred = favoriteCollectionKeys.includes(g.key);
        return (
          <CollectionDetails key={g.key} starred={starred} itemCount={g.items.length}>
            <summary className="flex cursor-pointer list-none items-center gap-3 p-3 marker:hidden [&::-webkit-details-marker]:hidden">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <div className="h-11 w-11 shrink-0 overflow-hidden rounded-md border border-border-subtle">
                  <NftImage
                    src={g.coverImage}
                    alt=""
                    className="h-11 w-11 object-cover"
                    emptyClassName="h-11 w-11 rounded-md border border-dashed border-border-subtle"
                  />
                </div>
                <div className="min-w-0" title={g.key !== "__uncategorized__" ? g.key : undefined}>
                  <p className="truncate font-display text-sm font-bold text-solana-green">{g.label}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {g.items.length} NFT{g.items.length === 1 ? "" : "s"} in this collection
                  </p>
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="shrink-0 gap-1 text-xs"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleFavoriteCollection(g.key);
                }}
                title={starred ? "Remove from favorites" : "Star collection"}
              >
                <Star
                  className={cn("h-4 w-4", starred && "fill-amber-400 text-amber-400")}
                  aria-hidden
                />
                {starred ? "Starred" : "Star"}
              </Button>
            </summary>
            <div className="border-t border-border-subtle/60 px-3 pb-3 pt-1">
              <NFTVirtualizedGrid
                nfts={g.items}
                onOpen={onOpen}
                selectionEnabled={selectionEnabled}
                onLoadMore={undefined}
                hasMoreNfts={false}
                offerMintSet={offerMintSet}
                scrollMaxHeight="min(52vh, 640px)"
              />
            </div>
          </CollectionDetails>
        );
      })}
      {hasMoreNfts && onLoadMore ? (
        <div className="flex justify-center pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={loadingMoreNfts}
            onClick={() => onLoadMore()}
          >
            {loadingMoreNfts ? "Loading…" : "Load more NFTs (all collections)"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
