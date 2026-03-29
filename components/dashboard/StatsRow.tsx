"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useAddressBalance } from "@/hooks/useAddressBalance";
import { useFloorPrice } from "@/hooks/useFloorPrice";
import { useWalletStore } from "@/store/walletStore";
import { applyNFTFilters } from "@/lib/nft-filters";
import type { NFT } from "@/types";

const panel =
  "border border-blue-800/50 bg-blue-950/90 text-solana-green shadow-md shadow-blue-950/30 backdrop-blur-sm";

interface StatsRowProps {
  viewAddress: string | null;
  nfts: NFT[];
}

export function StatsRow({ viewAddress, nfts }: StatsRowProps) {
  const filter = useWalletStore((s) => s.filter);
  const filtered = applyNFTFilters(nfts, filter);
  const { data: bal } = useAddressBalance(viewAddress);
  const { data: floor } = useFloorPrice(filter.collection ?? null);

  const floorEstimate =
    floor?.floorPrice != null && filter.collection
      ? filtered.length * floor.floorPrice
      : null;

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <Card className={panel}>
        <CardContent className="p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-solana-green/75">
            SOL balance
          </p>
          <p className="mt-1 font-mono text-2xl font-bold text-solana-green">
            {bal?.sol != null ? bal.sol.toFixed(4) : "—"}
          </p>
          <p className="text-xs text-solana-green/65">
            {bal?.usd != null ? `≈ $${bal.usd.toFixed(2)} USD` : "Price loading…"}
          </p>
        </CardContent>
      </Card>
      <Card className={panel}>
        <CardContent className="p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-solana-green/75">
            NFTs (filtered)
          </p>
          <p className="mt-1 font-display text-2xl font-extrabold text-solana-green">
            {filtered.length}
          </p>
          <p className="text-xs text-solana-green/65">Total loaded: {nfts.length}</p>
        </CardContent>
      </Card>
      <Card className={panel}>
        <CardContent className="p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-solana-green/75">
            Portfolio hint (floor × count)
          </p>
          <p className="mt-1 font-mono text-2xl font-bold text-solana-green">
            {floorEstimate != null ? `${floorEstimate.toFixed(3)} SOL` : "—"}
          </p>
          <p className="text-xs text-solana-green/65">
            {filter.collection
              ? `Magic Eden floor for ${filter.collection}`
              : "Select a collection filter to estimate"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
