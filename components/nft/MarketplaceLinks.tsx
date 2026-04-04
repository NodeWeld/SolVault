"use client";

import { ExternalLink } from "lucide-react";
import { getConfiguredCluster } from "@/lib/app-network";
import { hyperspaceTokenUrl, magicEdenItemUrl, tensorTradeUrl } from "@/lib/marketplace-links";
import { cn } from "@/lib/utils";

interface MarketplaceLinksProps {
  mint: string;
  className?: string;
  /** Hide headings/footnote when used inside another labeled panel (e.g. NFT detail). */
  embedded?: boolean;
}

const linkClass =
  "inline-flex items-center gap-1 rounded-md border border-border-subtle bg-surface/40 px-2.5 py-1.5 text-[11px] font-medium text-solana-green/90 transition-colors hover:border-solana-purple/50 hover:text-solana-green";

export function MarketplaceLinks({ mint, className, embedded }: MarketplaceLinksProps) {
  const cluster = getConfiguredCluster();

  if (cluster !== "mainnet-beta") {
    return (
      <p className={cn("text-[11px] leading-relaxed text-muted-foreground", className)}>
        Marketplace links use <span className="font-medium text-foreground/80">Mainnet</span>. Switch{" "}
        <span className="font-mono text-[10px]">NEXT_PUBLIC_SOLANA_NETWORK</span> to open live listings.
      </p>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      {!embedded ? (
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Marketplaces (open in new tab)
        </p>
      ) : null}
      <div className="flex flex-wrap gap-1.5">
        <a
          href={magicEdenItemUrl(mint)}
          target="_blank"
          rel="noopener noreferrer"
          className={linkClass}
        >
          Magic Eden
          <ExternalLink className="h-3 w-3 opacity-70" aria-hidden />
        </a>
        <a href={tensorTradeUrl(mint)} target="_blank" rel="noopener noreferrer" className={linkClass}>
          Tensor
          <ExternalLink className="h-3 w-3 opacity-70" aria-hidden />
        </a>
        <a
          href={hyperspaceTokenUrl(mint)}
          target="_blank"
          rel="noopener noreferrer"
          className={linkClass}
        >
          Hyperspace
          <ExternalLink className="h-3 w-3 opacity-70" aria-hidden />
        </a>
      </div>
      {!embedded ? (
        <p className="text-[10px] text-muted-foreground">
          Listing, delisting, and buying happen on those sites. SolVault only deep-links you there.
        </p>
      ) : null}
    </div>
  );
}
