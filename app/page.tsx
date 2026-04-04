"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobilePortfolioNav } from "@/components/layout/MobilePortfolioNav";
import { MobileWalletsSheet } from "@/components/layout/MobileWalletsSheet";
import { StatsRow } from "@/components/dashboard/StatsRow";
import { FilterBar } from "@/components/dashboard/FilterBar";
import { TokensPanel } from "@/components/dashboard/TokensPanel";
import { NFTGrid } from "@/components/nft/NFTGrid";
import { Button } from "@/components/ui/button";
import { WalletButton } from "@/components/wallet/WalletButton";
import { useNFTs, flattenNftPages } from "@/hooks/useNFTs";
import { useWalletOffers } from "@/hooks/useWalletOffers";
import { useWalletStore } from "@/store/walletStore";
import { applyNFTFilters } from "@/lib/nft-filters";
import {
  filterNftsByFavoriteCollections,
  sortNfts,
} from "@/lib/nft-gallery-utils";
import { cn } from "@/lib/utils";
import type { NFT } from "@/types";
import type { PortfolioMobileTab } from "@/components/layout/MobilePortfolioNav";

const ActivityFeed = dynamic(
  () =>
    import("@/components/dashboard/ActivityFeed").then((m) => ({
      default: m.ActivityFeed,
    })),
  {
    ssr: false,
    loading: () => (
      <div
        className="h-[min(24rem,50vh)] animate-pulse rounded-xl border border-blue-800/50 bg-blue-950/40"
        aria-hidden
      />
    ),
  }
);

const NFTDetail = dynamic(
  () => import("@/components/nft/NFTDetail").then((m) => ({ default: m.NFTDetail })),
  { ssr: false }
);

const BatchSendModal = dynamic(
  () =>
    import("@/components/transfer/BatchSendModal").then((m) => ({
      default: m.BatchSendModal,
    })),
  { ssr: false }
);

const ImportModal = dynamic(
  () => import("@/components/transfer/ImportModal").then((m) => ({ default: m.ImportModal })),
  { ssr: false }
);

export default function HomePage() {
  const { connected, publicKey } = useWallet();
  const activeWallet = useWalletStore((s) => s.activeWallet);
  const selected = useWalletStore((s) => s.selectedNFTs);
  const filter = useWalletStore((s) => s.filter);
  const nftSortOrder = useWalletStore((s) => s.nftSortOrder);
  const favoriteCollectionKeys = useWalletStore((s) => s.favoriteCollectionKeys);
  const nftFavoritesOnly = useWalletStore((s) => s.nftFavoritesOnly);

  const primary = publicKey?.toBase58() ?? null;
  const viewAddress = activeWallet ?? primary;

  const nftsQuery = useNFTs(viewAddress);
  const offersQuery = useWalletOffers(viewAddress);
  const offerMintSet = offersQuery.data ?? new Set<string>();
  const nfts = useMemo(() => flattenNftPages(nftsQuery.data), [nftsQuery.data]);
  const {
    isLoading,
    error: nftsError,
    isError: nftsIsError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = nftsQuery;
  const filtered = useMemo(() => applyNFTFilters(nfts, filter), [nfts, filter]);
  const galleryNfts = useMemo(() => {
    const f = filterNftsByFavoriteCollections(
      filtered,
      favoriteCollectionKeys,
      nftFavoritesOnly
    );
    return sortNfts(f, nftSortOrder);
  }, [filtered, favoriteCollectionKeys, nftFavoritesOnly, nftSortOrder]);

  const [detail, setDetail] = useState<NFT | null>(null);
  const [batchOpen, setBatchOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<PortfolioMobileTab>("nfts");
  const [walletsOpen, setWalletsOpen] = useState(false);

  if (!connected) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="mx-auto flex max-w-4xl flex-col items-center justify-center px-4 py-24 text-center">
          <div className="space-y-6 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-500">
            <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
              Your Solana NFTs,{" "}
              <span className="text-solana-purple">secured</span> and{" "}
              <span className="text-solana-green">organized</span>
            </h1>
            <p className="mx-auto max-w-xl text-lg text-muted-foreground">
              SolVault is a wallet-friendly portfolio for Solana: NFTs and tokens, multi-wallet
              tracking, Helius-powered metadata, batch sends, Magic Eden floors, and an optional
              Anchor vault program. Connect your wallet to open your portfolio.
            </p>
            <div className="flex justify-center">
              <WalletButton />
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      <div className="mx-auto flex max-w-7xl">
        <Sidebar />
        <main className="flex-1 space-y-6 px-4 py-6 pb-24 sm:px-6 lg:pb-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="font-display text-2xl font-extrabold">Portfolio</h1>
              <p className="font-mono text-[11px] text-muted-foreground">
                Viewing: {viewAddress ?? "—"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground lg:hidden">
                {mobileTab === "nfts"
                  ? "Collectibles"
                  : mobileTab === "tokens"
                    ? "Tokens & SOL"
                    : "Recent activity"}
              </p>
            </div>
            <div
              className={cn(
                "flex flex-wrap gap-2",
                mobileTab !== "nfts" && "hidden lg:flex"
              )}
            >
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

          <div className={cn(mobileTab !== "nfts" && "hidden lg:block")}>
            <FilterBar nfts={nfts} />
          </div>

          <div className={cn("flex flex-col gap-3", mobileTab !== "nfts" && "hidden lg:flex")}>
            {nftsIsError ? (
              <p className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">
                {nftsError instanceof Error ? nftsError.message : "Failed to load NFTs"}
              </p>
            ) : null}

            {!isLoading && nfts.length > 0 && galleryNfts.length === 0 ? (
              <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-100">
                You have {nfts.length} NFT(s) loaded, but the current filters or{" "}
                <span className="font-medium">Favorites only</span> view hides all of them. Clear
                filters in the filter bar, turn off favorites-only, or star collections in{" "}
                <span className="font-medium">Collections</span> view.
              </p>
            ) : null}
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
            <div className={cn(mobileTab !== "nfts" && "hidden lg:block")}>
              <NFTGrid
                nfts={galleryNfts}
                loading={isLoading}
                onOpen={setDetail}
                selectionEnabled={viewAddress === primary}
                onLoadMore={() => void fetchNextPage()}
                hasMoreNfts={Boolean(hasNextPage)}
                loadingMoreNfts={isFetchingNextPage}
                offerMintSet={offerMintSet}
              />
            </div>
            <div className="flex flex-col gap-6">
              <div className={cn(mobileTab !== "tokens" && "hidden lg:block")}>
                <TokensPanel
                  viewAddress={viewAddress}
                  canSend={Boolean(primary && viewAddress === primary)}
                  senderAddress={primary ?? ""}
                />
              </div>
              <div className={cn(mobileTab !== "activity" && "hidden lg:block")}>
                <ActivityFeed address={viewAddress} />
              </div>
            </div>
          </div>
        </main>
      </div>

      <NFTDetail
        nft={detail}
        open={Boolean(detail)}
        onClose={() => setDetail(null)}
        viewAddress={viewAddress}
        connectedAddress={primary}
        hasOffer={detail ? offerMintSet.has(detail.mint) : false}
      />

      <BatchSendModal
        open={batchOpen}
        onClose={() => setBatchOpen(false)}
        senderAddress={primary ?? ""}
      />

      <MobilePortfolioNav
        active={mobileTab}
        onChange={setMobileTab}
        onOpenWallets={() => setWalletsOpen(true)}
      />
      <MobileWalletsSheet open={walletsOpen} onOpenChange={setWalletsOpen} />
    </div>
  );
}
