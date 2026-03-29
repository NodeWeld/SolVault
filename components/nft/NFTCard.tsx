"use client";

import type { NFT } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useWalletStore } from "@/store/walletStore";
import { collectionDisplayLabel } from "@/lib/nft-filters";

interface NFTCardProps {
  nft: NFT;
  onOpen: (nft: NFT) => void;
  selectionEnabled?: boolean;
}

export function NFTCard({ nft, onOpen, selectionEnabled = true }: NFTCardProps) {
  const toggleNFT = useWalletStore((s) => s.toggleNFT);
  const selected = useWalletStore((s) => s.selectedNFTs.includes(nft.mint));

  return (
    <div className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1 motion-safe:duration-300">
      <Card
        className={cn(
          "group cursor-pointer overflow-hidden border-solana-purple/45 transition-shadow hover:border-solana-purple hover:shadow-lg hover:shadow-solana-purple/15",
          selected && "ring-2 ring-solana-green/60"
        )}
        onClick={() => onOpen(nft)}
      >
        <div className="relative aspect-square bg-black/40">
          {nft.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={nft.image}
              alt={nft.name}
              className="absolute inset-0 h-full w-full object-cover transition-transform group-hover:scale-[1.02]"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
              No image
            </div>
          )}
          {nft.compressed ? (
            <Badge className="absolute left-2 top-2" variant="secondary">
              cNFT
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
          <p className="truncate font-display text-sm font-bold text-solana-green">
            {nft.name}
          </p>
          <p className="truncate text-xs text-solana-green/65">
            {collectionDisplayLabel(nft)}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
