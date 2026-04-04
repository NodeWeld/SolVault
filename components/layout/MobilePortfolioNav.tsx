"use client";

import { cn } from "@/lib/utils";
import { ImageIcon, Coins, ListTree, Wallet } from "lucide-react";

export type PortfolioMobileTab = "nfts" | "tokens" | "activity";

interface MobilePortfolioNavProps {
  active: PortfolioMobileTab;
  onChange: (tab: PortfolioMobileTab) => void;
  onOpenWallets: () => void;
}

const item =
  "flex flex-1 flex-col items-center gap-0.5 rounded-lg py-2 text-[10px] font-medium text-muted-foreground transition-colors";

const itemActive = "bg-solana-purple/15 text-solana-green";

export function MobilePortfolioNav({
  active,
  onChange,
  onOpenWallets,
}: MobilePortfolioNavProps) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border-subtle bg-[#080B12]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
      aria-label="Portfolio sections"
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-between gap-1 px-2 pt-1">
        <button
          type="button"
          className={cn(item, active === "nfts" && itemActive)}
          onClick={() => onChange("nfts")}
        >
          <ImageIcon className="h-5 w-5" aria-hidden />
          NFTs
        </button>
        <button
          type="button"
          className={cn(item, active === "tokens" && itemActive)}
          onClick={() => onChange("tokens")}
        >
          <Coins className="h-5 w-5" aria-hidden />
          Tokens
        </button>
        <button
          type="button"
          className={cn(item, active === "activity" && itemActive)}
          onClick={() => onChange("activity")}
        >
          <ListTree className="h-5 w-5" aria-hidden />
          Activity
        </button>
        <button type="button" className={cn(item)} onClick={onOpenWallets}>
          <Wallet className="h-5 w-5" aria-hidden />
          Wallets
        </button>
      </div>
    </nav>
  );
}
