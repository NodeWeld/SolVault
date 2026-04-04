"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { NFTFilter, TrackedWallet } from "@/types";
import type { NftSortOrder, NftViewMode } from "@/lib/nft-gallery-utils";

export interface WalletState {
  wallets: TrackedWallet[];
  selectedNFTs: string[];
  filter: NFTFilter;
  activeWallet: string | null;
  /** Gallery: flat grid vs grouped by collection. */
  nftViewMode: NftViewMode;
  nftSortOrder: NftSortOrder;
  /** `collectionKey(nft)` values starred in the collection view. */
  favoriteCollectionKeys: string[];
  nftFavoritesOnly: boolean;
  addWallet: (address: string, label: string, isOwned?: boolean) => void;
  removeWallet: (address: string) => void;
  toggleNFT: (mint: string) => void;
  clearSelection: () => void;
  setFilter: (filter: Partial<NFTFilter>) => void;
  setActiveWallet: (address: string | null) => void;
  isNFTSelected: (mint: string) => boolean;
  setNftViewMode: (mode: NftViewMode) => void;
  setNftSortOrder: (order: NftSortOrder) => void;
  setNftFavoritesOnly: (v: boolean) => void;
  toggleFavoriteCollection: (collectionKey: string) => void;
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => ({
      wallets: [],
      selectedNFTs: [],
      filter: {},
      activeWallet: null,
      nftViewMode: "flat",
      nftSortOrder: "none",
      favoriteCollectionKeys: [],
      nftFavoritesOnly: false,

      addWallet: (address, label, isOwned = false) => {
        const normalized = address.trim();
        if (!normalized) return;
        const existing = get().wallets.some((w) => w.address === normalized);
        if (existing) return;
        set((s) => ({
          wallets: [
            ...s.wallets,
            {
              address: normalized,
              label: label.trim() || normalized.slice(0, 4) + "…",
              isOwned,
              addedAt: Date.now(),
            },
          ],
        }));
      },

      removeWallet: (address) => {
        set((s) => ({
          wallets: s.wallets.filter((w) => w.address !== address),
          activeWallet: s.activeWallet === address ? null : s.activeWallet,
        }));
      },

      toggleNFT: (mint) => {
        set((s) => {
          const has = s.selectedNFTs.includes(mint);
          return {
            selectedNFTs: has
              ? s.selectedNFTs.filter((m) => m !== mint)
              : [...s.selectedNFTs, mint],
          };
        });
      },

      clearSelection: () => set({ selectedNFTs: [] }),

      setFilter: (partial) =>
        set((s) => ({
          filter: { ...s.filter, ...partial },
        })),

      setActiveWallet: (address) => set({ activeWallet: address }),

      isNFTSelected: (mint) => get().selectedNFTs.includes(mint),

      setNftViewMode: (mode) => set({ nftViewMode: mode }),
      setNftSortOrder: (order) => set({ nftSortOrder: order }),
      setNftFavoritesOnly: (v) => set({ nftFavoritesOnly: v }),

      toggleFavoriteCollection: (collectionKey) => {
        set((s) => {
          const has = s.favoriteCollectionKeys.includes(collectionKey);
          return {
            favoriteCollectionKeys: has
              ? s.favoriteCollectionKeys.filter((k) => k !== collectionKey)
              : [...s.favoriteCollectionKeys, collectionKey],
          };
        });
      },
    }),
    {
      name: "solvault-wallet-store",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
