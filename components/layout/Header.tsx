"use client";

import { useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { motion } from "framer-motion";
import { WalletButton } from "@/components/wallet/WalletButton";
import { WalletBadge } from "@/components/wallet/WalletBadge";
import { useSolPrice } from "@/hooks/useSolPrice";
import { useWalletStore } from "@/store/walletStore";

export function Header() {
  const { publicKey, connected } = useWallet();
  const { data: price } = useSolPrice();
  const addWallet = useWalletStore((s) => s.addWallet);
  const setActiveWallet = useWalletStore((s) => s.setActiveWallet);

  // Use string identity — `publicKey` is often a new object each render from the adapter.
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
    <header className="sticky top-0 z-40 border-b border-border-subtle bg-[#080B12]/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <motion.div
          className="flex items-center gap-2"
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="font-display text-xl font-extrabold tracking-tight">
            <span className="text-solana-purple">Sol</span>
            <span className="text-solana-green">Vault</span>
          </div>
        </motion.div>

        <div className="flex flex-1 items-center justify-end gap-3">
          {price?.usd != null ? (
            <div className="hidden items-center gap-2 rounded-md border border-border-subtle bg-surface px-3 py-1.5 text-xs sm:flex">
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
          <WalletBadge />
          <WalletButton />
        </div>
      </div>
    </header>
  );
}
