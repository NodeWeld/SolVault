"use client";

import { useMemo, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { motion } from "framer-motion";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { StatsRow } from "@/components/dashboard/StatsRow";
import { FilterBar } from "@/components/dashboard/FilterBar";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { NFTGrid } from "@/components/nft/NFTGrid";
import { NFTDetail } from "@/components/nft/NFTDetail";
import { BatchSendModal } from "@/components/transfer/BatchSendModal";
import { ImportModal } from "@/components/transfer/ImportModal";
import { Button } from "@/components/ui/button";
import { WalletButton } from "@/components/wallet/WalletButton";
import { useNFTs } from "@/hooks/useNFTs";
import { useWalletStore } from "@/store/walletStore";
import { applyNFTFilters } from "@/lib/nft-filters";
import type { NFT } from "@/types";

export default function HomePage() {
  const { connected, publicKey } = useWallet();
  const activeWallet = useWalletStore((s) => s.activeWallet);
  const selected = useWalletStore((s) => s.selectedNFTs);
  const filter = useWalletStore((s) => s.filter);

  const primary = publicKey?.toBase58() ?? null;
  const viewAddress = activeWallet ?? primary;

  const {
    data: nfts = [],
    isLoading,
    error: nftsError,
    isError: nftsIsError,
  } = useNFTs(viewAddress);
  const filtered = useMemo(() => applyNFTFilters(nfts, filter), [nfts, filter]);

  const [detail, setDetail] = useState<NFT | null>(null);
  const [batchOpen, setBatchOpen] = useState(false);

  if (!connected) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="mx-auto flex max-w-4xl flex-col items-center justify-center px-4 py-24 text-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
              Your Solana NFTs,{" "}
              <span className="text-solana-purple">secured</span> and{" "}
              <span className="text-solana-green">organized</span>
            </h1>
            <p className="mx-auto max-w-xl text-lg text-muted-foreground">
              SolVault is a production-grade portfolio for NFTs: multi-wallet tracking, Helius-powered
              metadata, batch sends, Magic Eden floors, and an optional Anchor vault program.
            </p>
            <div className="flex justify-center">
              <WalletButton />
            </div>
          </motion.div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      <div className="mx-auto flex max-w-7xl">
        <Sidebar />
        <main className="flex-1 space-y-6 px-4 py-6 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="font-display text-2xl font-extrabold">Dashboard</h1>
              <p className="font-mono text-[11px] text-muted-foreground">
                Viewing: {viewAddress ?? "—"}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <ImportModal />
              <Button
                variant="outline"
                size="sm"
                disabled={!selected.length}
                onClick={() => setBatchOpen(true)}
              >
                Batch send ({selected.length})
              </Button>
            </div>
          </div>

          <StatsRow viewAddress={viewAddress} nfts={nfts} />

          <FilterBar nfts={nfts} />

          {nftsIsError ? (
            <p className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">
              {nftsError instanceof Error ? nftsError.message : "Failed to load NFTs"}
            </p>
          ) : null}

          {!isLoading && nfts.length > 0 && filtered.length === 0 ? (
            <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-100">
              You have {nfts.length} NFT(s) loaded, but filters hide all of them. Use{" "}
              <span className="font-medium">Clear filters</span> in the filter bar (or turn off{" "}
              <span className="font-medium">Has image</span> if metadata images are missing).
            </p>
          ) : null}

          <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
            <NFTGrid
              nfts={filtered}
              loading={isLoading}
              onOpen={setDetail}
              selectionEnabled={viewAddress === primary}
            />
            <ActivityFeed address={viewAddress} />
          </div>
        </main>
      </div>

      <NFTDetail
        nft={detail}
        open={Boolean(detail)}
        onClose={() => setDetail(null)}
        viewAddress={viewAddress}
        connectedAddress={primary}
      />

      <BatchSendModal
        open={batchOpen}
        onClose={() => setBatchOpen(false)}
        senderAddress={primary ?? ""}
      />
    </div>
  );
}
