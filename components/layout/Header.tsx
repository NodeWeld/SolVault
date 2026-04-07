"use client";

import { Fragment, useEffect } from "react";
import Link from "next/link";
import { Settings } from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletButton } from "@/components/wallet/WalletButton";
import { WalletBadge } from "@/components/wallet/WalletBadge";
import {
  AddressReceiveDialog,
  CopyAddressButton,
} from "@/components/wallet/AddressReceiveDialog";
import { NetworkBadge } from "@/components/layout/NetworkBadge";
import { NetworkHintBanner } from "@/components/layout/NetworkHintBanner";
import { SiwsSessionBar } from "@/components/auth/SiwsSessionBar";
import { HeaderActions } from "@/components/layout/HeaderActions";
import { useSolPrice } from "@/hooks/useSolPrice";
import { useWalletStore } from "@/store/walletStore";
import { Button } from "@/components/ui/button";

export function Header() {
  const { publicKey, connected } = useWallet();
  const { data: price } = useSolPrice();
  const addWallet = useWalletStore((s) => s.addWallet);
  const setActiveWallet = useWalletStore((s) => s.setActiveWallet);

  const connectedAddress = publicKey?.toBase58() ?? null;

  useEffect(() => {
    if (!connected || !connectedAddress) return;
    addWallet(connectedAddress, "Primary", true);
    setActiveWallet(connectedAddress);
  }, [connected, connectedAddress, addWallet, setActiveWallet]);

  const change = price?.change24h;
  const changeStr =
    change == null ? "" : `${change >= 0 ? "+" : ""}${change.toFixed(2)}%`;

  return (
    <Fragment>
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#070a10]/85 backdrop-blur-xl supports-[backdrop-filter]:bg-[#070a10]/65">
        <div className="mx-auto flex min-h-[3.25rem] max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-2.5 sm:flex-nowrap sm:px-6">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/"
              className="font-display text-xl font-extrabold tracking-tight motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-1 motion-safe:duration-300"
            >
              <span className="text-solana-purple">Sol</span>
              <span className="text-solana-green">Vault</span>
            </Link>
            {connected ? <NetworkBadge className="hidden sm:inline-flex" /> : null}
          </div>

          <div className="flex flex-1 flex-wrap items-center justify-end gap-2 sm:gap-3">
            {price?.usd != null ? (
              <div className="hidden items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-3.5 py-1.5 text-xs shadow-sm shadow-black/20 md:flex">
                <span className="text-muted-foreground">SOL</span>
                <span className="font-mono font-semibold text-foreground">
                  ${price.usd.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </span>
                {changeStr ? (
                  <span className={change != null && change >= 0 ? "text-solana-green" : "text-red-400"}>
                    {changeStr}
                  </span>
                ) : null}
              </div>
            ) : null}
            {connectedAddress ? (
              <>
                <CopyAddressButton address={connectedAddress} size="icon" className="shrink-0" />
                <AddressReceiveDialog address={connectedAddress} triggerLabel="Receive" />
              </>
            ) : null}
            <HeaderActions connectedAddress={connectedAddress} />
            <Link href="/settings">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8 shrink-0 border-border-subtle"
                aria-label="Settings"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </Link>
            <WalletBadge />
            <WalletButton />
          </div>
        </div>
      </header>
      {connected ? <NetworkHintBanner /> : null}
      {connected ? <SiwsSessionBar /> : null}
    </Fragment>
  );
}
