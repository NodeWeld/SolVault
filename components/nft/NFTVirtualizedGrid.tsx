"use client";

import { useEffect, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { NFT } from "@/types";
import { NFTCard } from "@/components/nft/NFTCard";
import { NFTSkeleton } from "@/components/nft/NFTSkeleton";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const ESTIMATED_ROW_PX = 312;

function useNftGridColumns(): number {
  const [cols, setCols] = useState(2);
  useEffect(() => {
    const update = () => {
      const w = typeof window !== "undefined" ? window.innerWidth : 1024;
      if (w >= 1024) setCols(4);
      else if (w >= 640) setCols(3);
      else setCols(2);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return cols;
}

export interface NFTVirtualizedGridProps {
  nfts: NFT[];
  loading?: boolean;
  onOpen: (nft: NFT) => void;
  selectionEnabled?: boolean;
  onLoadMore?: () => void;
  hasMoreNfts?: boolean;
  loadingMoreNfts?: boolean;
  offerMintSet?: Set<string>;
  /** Scrollport height, e.g. `min(85vh,1200px)` or a fixed px value. */
  scrollMaxHeight?: string;
}

export function NFTVirtualizedGrid({
  nfts,
  loading,
  onOpen,
  selectionEnabled,
  onLoadMore,
  hasMoreNfts,
  loadingMoreNfts,
  offerMintSet,
  scrollMaxHeight = "min(85vh, 1200px)",
}: NFTVirtualizedGridProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const columnCount = useNftGridColumns();
  const rowCount = Math.ceil(nfts.length / columnCount) || 0;

  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ESTIMATED_ROW_PX,
    overscan: 2,
  });

  useEffect(() => {
    const el = parentRef.current;
    if (!el || !onLoadMore || !hasMoreNfts || loadingMoreNfts) return;
    const onScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      if (scrollHeight - scrollTop - clientHeight < 720) onLoadMore();
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => el.removeEventListener("scroll", onScroll);
  }, [onLoadMore, hasMoreNfts, loadingMoreNfts, nfts.length, rowCount]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <NFTSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!nfts.length) {
    return (
      <div className="rounded-xl border border-dashed border-border-subtle bg-surface/40 p-12 text-center text-sm text-muted-foreground">
        No NFTs found for this wallet with the current filters.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div
        ref={parentRef}
        className="overflow-auto rounded-xl border border-border-subtle/60 bg-black/20 pr-1"
        style={{ maxHeight: scrollMaxHeight }}
      >
        <div
          className="relative w-full p-3"
          style={{ height: virtualizer.getTotalSize() }}
        >
          {virtualizer.getVirtualItems().map((row) => {
            const start = row.index * columnCount;
            const rowItems = nfts.slice(start, start + columnCount);
            return (
              <div
                key={row.key}
                className="absolute left-0 top-0 w-full px-0 pb-3"
                style={{
                  transform: `translateY(${row.start}px)`,
                  height: row.size,
                }}
              >
                <div
                  className="grid h-full gap-3"
                  style={{
                    gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
                  }}
                >
                  {rowItems.map((nft) => (
                    <NFTCard
                      key={nft.mint}
                      nft={nft}
                      onOpen={onOpen}
                      selectionEnabled={selectionEnabled}
                      hasOffer={offerMintSet?.has(nft.mint) ?? false}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {hasMoreNfts && onLoadMore ? (
        <div className="flex justify-center">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={loadingMoreNfts}
            onClick={() => onLoadMore()}
            className={cn(loadingMoreNfts && "gap-2")}
          >
            {loadingMoreNfts ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading…
              </>
            ) : (
              "Load more NFTs"
            )}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
