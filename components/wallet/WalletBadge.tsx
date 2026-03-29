"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { Badge } from "@/components/ui/badge";

function shorten(addr: string) {
  if (addr.length <= 10) return addr;
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}

export function WalletBadge() {
  const { publicKey, connected } = useWallet();
  if (!connected || !publicKey) return null;
  const s = publicKey.toBase58();
  return (
    <Badge variant="outline" className="font-mono text-[11px]">
      {shorten(s)}
    </Badge>
  );
}
