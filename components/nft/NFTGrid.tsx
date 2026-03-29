"use client";

import type { NFT } from "@/types";
import { NFTCard } from "@/components/nft/NFTCard";
import { NFTSkeleton } from "@/components/nft/NFTSkeleton";

interface NFTGridProps {
  nfts: NFT[];
  loading?: boolean;
  onOpen: (nft: NFT) => void;
  selectionEnabled?: boolean;
}

export function NFTGrid({ nfts, loading, onOpen, selectionEnabled }: NFTGridProps) {
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
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {nfts.map((nft) => (
        <NFTCard
          key={nft.mint}
          nft={nft}
          onOpen={onOpen}
          selectionEnabled={selectionEnabled}
        />
      ))}
    </div>
  );
}
