"use client";

import type { NFT } from "@/types";
import { NFTGalleryToolbar } from "@/components/nft/NFTGalleryToolbar";
import { NFTVirtualizedGrid } from "@/components/nft/NFTVirtualizedGrid";
import { NFTCollectionsView } from "@/components/nft/NFTCollectionsView";
import { useWalletStore } from "@/store/walletStore";
import { groupNftsByCollection } from "@/lib/nft-gallery-utils";

export interface NFTGalleryProps {
  nfts: NFT[];
  loading?: boolean;
  onOpen: (nft: NFT) => void;
  selectionEnabled?: boolean;
  onLoadMore?: () => void;
  hasMoreNfts?: boolean;
  loadingMoreNfts?: boolean;
  offerMintSet?: Set<string>;
  showToolbar?: boolean;
}

export function NFTGallery({
  nfts,
  loading,
  onOpen,
  selectionEnabled,
  onLoadMore,
  hasMoreNfts,
  loadingMoreNfts,
  offerMintSet,
  showToolbar = true,
}: NFTGalleryProps) {
  const nftViewMode = useWalletStore((s) => s.nftViewMode);
  const favoriteCollectionKeys = useWalletStore((s) => s.favoriteCollectionKeys);

  const groups =
    nftViewMode === "collections" && !loading && nfts.length
      ? groupNftsByCollection(nfts, favoriteCollectionKeys)
      : null;

  return (
    <div className="space-y-3">
      {showToolbar ? <NFTGalleryToolbar /> : null}
      {groups ? (
        <NFTCollectionsView
          groups={groups}
          loading={loading}
          onOpen={onOpen}
          selectionEnabled={selectionEnabled}
          onLoadMore={onLoadMore}
          hasMoreNfts={hasMoreNfts}
          loadingMoreNfts={loadingMoreNfts}
          offerMintSet={offerMintSet}
        />
      ) : (
        <NFTVirtualizedGrid
          nfts={nfts}
          loading={loading}
          onOpen={onOpen}
          selectionEnabled={selectionEnabled}
          onLoadMore={onLoadMore}
          hasMoreNfts={hasMoreNfts}
          loadingMoreNfts={loadingMoreNfts}
          offerMintSet={offerMintSet}
        />
      )}
    </div>
  );
}
