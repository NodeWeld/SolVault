"use client";

import type { NFT } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useWalletStore } from "@/store/walletStore";
import { nftCardDisplayParts } from "@/lib/nft-filters";
import { NftImage } from "@/components/nft/NftImage";

interface NFTCardProps {
  nft: NFT;
  onOpen: (nft: NFT) => void;
  selectionEnabled?: boolean;
  /** Mainnet Magic Eden “offers received” hint (best-effort). */
  hasOffer?: boolean;
}

export function NFTCard({
  nft,
  onOpen,
  selectionEnabled = true,
  hasOffer = false,
}: NFTCardProps) {
  const toggleNFT = useWalletStore((s) => s.toggleNFT);
  const selected = useWalletStore((s) => s.selectedNFTs.includes(nft.mint));
  const { title, collectionLine } = nftCardDisplayParts(nft);

  return (
    <div className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1 motion-safe:duration-300">
      <Card
        className={cn(
          "group cursor-pointer overflow-hidden border-solana-purple/45 transition-shadow hover:border-solana-purple hover:shadow-lg hover:shadow-solana-purple/15",
          selected && "ring-2 ring-solana-green/60"
        )}
        onClick={() => onOpen(nft)}
      >
        <div className="relative aspect-square overflow-hidden bg-black/40">
          <NftImage
            src={nft.image}
            alt={title}
            className="absolute inset-0 h-full w-full object-cover transition-transform group-hover:scale-[1.02]"
            emptyClassName="absolute inset-0 h-full w-full"
          />
          {nft.compressed ? (
            <Badge className="absolute left-2 top-2" variant="secondary">
              cNFT
            </Badge>
          ) : null}
          {hasOffer ? (
            <Badge className="absolute bottom-2 left-2 border-amber-500/50 bg-amber-950/90 text-amber-100">
              Offer
            </Badge>
          ) : null}
          {selectionEnabled ? (
            <button
              type="button"
              className={cn(
                "absolute right-2 top-2 rounded-md border border-border-subtle bg-black/60 px-2 py-1 text-[10px] font-semibold uppercase text-white backdrop-blur",
                selected ? "border-solana-green text-solana-green" : "hover:border-solana-purple"
              )}
              onClick={(e) => {
                e.stopPropagation();
                toggleNFT(nft.mint);
              }}
            >
              {selected ? "Selected" : "Select"}
            </button>
          ) : null}
        </div>
        <CardContent className="space-y-1 border-t border-blue-800/50 bg-blue-950/90 p-3 backdrop-blur-sm">
          <p className="truncate font-display text-sm font-bold text-solana-green" title={nft.name}>
            {title}
          </p>
          <p className="truncate text-xs text-solana-green/65" title={collectionLine}>
            {collectionLine}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
