"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { NFTFilter, TrackedWallet } from "@/types";

export interface WalletState {
  wallets: TrackedWallet[];
  selectedNFTs: string[];
  filter: NFTFilter;
  activeWallet: string | null;
  addWallet: (address: string, label: string, isOwned?: boolean) => void;
  removeWallet: (address: string) => void;
  toggleNFT: (mint: string) => void;
  clearSelection: () => void;
  setFilter: (filter: Partial<NFTFilter>) => void;
  setActiveWallet: (address: string | null) => void;
  isNFTSelected: (mint: string) => boolean;
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => ({
      wallets: [],
      selectedNFTs: [],
      filter: {},
      activeWallet: null,

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
    }),
    {
      name: "solvault-wallet-store",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
