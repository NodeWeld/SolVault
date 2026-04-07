"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface SavedRecipient {
  address: string;
  label: string;
  addedAt: number;
}

interface RecipientBookState {
  recipients: SavedRecipient[];
  upsertRecipient: (address: string, label: string) => void;
  removeRecipient: (address: string) => void;
}

function normalizeAddress(a: string) {
  return a.trim();
}

export const useRecipientBookStore = create<RecipientBookState>()(
  persist(
    (set, get) => ({
      recipients: [],

      upsertRecipient: (address, label) => {
        const addr = normalizeAddress(address);
        if (!addr) return;
        const lab = label.trim() || addr.slice(0, 4) + "…" + addr.slice(-4);
        const existing = get().recipients.filter((r) => r.address !== addr);
        set({
          recipients: [...existing, { address: addr, label: lab, addedAt: Date.now() }].sort((a, b) =>
            a.label.localeCompare(b.label, undefined, { sensitivity: "base" })
          ),
        });
      },

      removeRecipient: (address) => {
        const addr = normalizeAddress(address);
        set((s) => ({ recipients: s.recipients.filter((r) => r.address !== addr) }));
      },
    }),
    {
      name: "solvault-recipient-book",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
