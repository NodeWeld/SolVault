"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { AddWalletModal } from "@/components/wallet/AddWalletModal";
import {
  AddressReceiveDialog,
  CopyAddressButton,
} from "@/components/wallet/AddressReceiveDialog";
import { useWalletStore } from "@/store/walletStore";
import { cn } from "@/lib/utils";

const activeAddressPanel =
  "rounded-xl border border-blue-800/50 bg-blue-950/90 p-3 text-solana-green shadow-md shadow-blue-950/30 backdrop-blur-sm";

const activeAddressBtn =
  "border-blue-700/40 text-solana-green hover:bg-blue-900/50 hover:text-solana-green";

interface PortfolioSidebarBodyProps {
  /** For mobile drawer: close after picking a wallet. */
  onWalletPicked?: () => void;
  /** ScrollArea height class; default fits desktop sidebar. */
  scrollAreaClassName?: string;
}

export function PortfolioSidebarBody({
  onWalletPicked,
  scrollAreaClassName = "h-[calc(100vh-12rem)]",
}: PortfolioSidebarBodyProps) {
  const { publicKey } = useWallet();
  const wallets = useWalletStore((s) => s.wallets);
  const activeWallet = useWalletStore((s) => s.activeWallet);
  const setActiveWallet = useWalletStore((s) => s.setActiveWallet);
  const removeWallet = useWalletStore((s) => s.removeWallet);
  const primary = publicKey?.toBase58() ?? null;
  const receiveAddress = activeWallet ?? primary;

  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Wallets
        </p>
        <AddWalletModal />
      </div>
      <Separator className="bg-border-subtle" />
      {receiveAddress ? (
        <div className={activeAddressPanel}>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-solana-green/80">
            Active address
          </p>
          <p className="mb-3 break-all font-mono text-[10px] leading-relaxed text-solana-green/70">
            {receiveAddress}
          </p>
          <div className="flex flex-wrap gap-1.5">
            <CopyAddressButton
              address={receiveAddress}
              size="sm"
              className={cn("flex-1 text-xs", activeAddressBtn)}
            />
            <AddressReceiveDialog
              address={receiveAddress}
              triggerLabel="QR"
              size="sm"
              triggerClassName={cn("flex-1 text-xs", activeAddressBtn)}
            />
          </div>
        </div>
      ) : null}
      <ScrollArea className={cn(scrollAreaClassName, "pr-2")}>
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
                    onClick={() => {
                      setActiveWallet(w.address);
                      onWalletPicked?.();
                    }}
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
  );
}
