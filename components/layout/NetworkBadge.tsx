"use client";

import { cn } from "@/lib/utils";
import { clusterShortLabel, getConfiguredCluster, type AppCluster } from "@/lib/app-network";

interface NetworkBadgeProps {
  className?: string;
  cluster?: AppCluster;
}

export function NetworkBadge({ className, cluster: clusterProp }: NetworkBadgeProps) {
  const cluster = clusterProp ?? getConfiguredCluster();
  const label = clusterShortLabel(cluster);
  const isMain = cluster === "mainnet-beta";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        isMain
          ? "border-solana-green/40 bg-solana-green/10 text-solana-green"
          : "border-amber-500/40 bg-amber-500/10 text-amber-200/90",
        className
      )}
      title={cluster}
    >
      {label}
    </span>
  );
}
