"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { AddWalletModal } from "@/components/wallet/AddWalletModal";
import { useWalletStore } from "@/store/walletStore";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const { publicKey } = useWallet();
  const wallets = useWalletStore((s) => s.wallets);
  const activeWallet = useWalletStore((s) => s.activeWallet);
  const setActiveWallet = useWalletStore((s) => s.setActiveWallet);
  const removeWallet = useWalletStore((s) => s.removeWallet);
  const primary = publicKey?.toBase58() ?? null;

  return (
    <aside className="hidden w-64 shrink-0 border-r border-border-subtle bg-[#080B12]/60 lg:block">
      <div className="flex h-full flex-col gap-3 p-4">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Wallets
          </p>
          <AddWalletModal />
        </div>
        <Separator className="bg-border-subtle" />
        <ScrollArea className="h-[calc(100vh-12rem)] pr-2">
          <ul className="space-y-1">
            {wallets.map((w) => {
              const isActive = activeWallet === w.address || (!activeWallet && w.address === primary);
              return (
                <li key={w.address}>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant={isActive ? "secondary" : "ghost"}
                      className={cn(
                        "h-auto flex-1 justify-start px-2 py-2 text-left font-mono text-[11px]",
                        isActive && "border border-solana-purple/40 bg-solana-purple/10"
                      )}
                      onClick={() => setActiveWallet(w.address)}
                    >
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate text-xs font-sans font-medium text-foreground">
                          {w.label}
                        </span>
                        <span className="truncate text-[10px] text-muted-foreground">
                          {w.address.slice(0, 4)}…{w.address.slice(-4)}
                        </span>
                        {w.isOwned ? (
                          <span className="text-[10px] text-solana-green">Connected</span>
                        ) : null}
                      </span>
                    </Button>
                    {!w.isOwned ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="shrink-0 text-muted-foreground hover:text-red-400"
                        onClick={() => removeWallet(w.address)}
                        aria-label="Remove wallet"
                      >
                        ×
                      </Button>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        </ScrollArea>
      </div>
    </aside>
  );
}
