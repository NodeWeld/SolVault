"use client";

import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { NetworkBadge } from "@/components/layout/NetworkBadge";
import {
  clusterHintSentence,
  clusterShortLabel,
  getConfiguredCluster,
} from "@/lib/app-network";
import { WalletSessionSection } from "@/components/wallet/WalletSessionSection";
import { RpcPickerSection } from "@/components/settings/RpcPickerSection";
import {
  settingsPanelBodyClass,
  settingsPanelButtonClass,
  settingsPanelClass,
  settingsPanelCodeClass,
  settingsPanelFineClass,
  settingsPanelMutedClass,
  settingsPanelTitleClass,
} from "@/lib/settings-panel";

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const cluster = getConfiguredCluster();

  function refreshPortfolio() {
    void queryClient.invalidateQueries();
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main id="main-content" className="mx-auto max-w-lg space-y-6 px-4 py-8 sm:px-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild className="shrink-0">
            <Link href="/" aria-label="Back to portfolio">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="font-display text-2xl font-extrabold text-foreground">Settings</h1>
            <p className="text-sm text-muted-foreground">Wallet and app preferences</p>
          </div>
        </div>

        <WalletSessionSection />

        <section className={settingsPanelClass}>
          <h2 className={settingsPanelTitleClass}>Network</h2>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <NetworkBadge cluster={cluster} />
            <span className={settingsPanelBodyClass}>{clusterShortLabel(cluster)}</span>
          </div>
          <p className={`mt-3 ${settingsPanelFineClass}`}>
            {clusterHintSentence(cluster)} Change{" "}
            <code className={settingsPanelCodeClass}>NEXT_PUBLIC_SOLANA_NETWORK</code> and{" "}
            <code className={settingsPanelCodeClass}>NEXT_PUBLIC_RPC_URL</code> in your env, then restart
            the dev server.
          </p>
        </section>

        <section className={settingsPanelClass}>
          <h2 className={settingsPanelTitleClass}>Data</h2>
          <p className={`mt-2 ${settingsPanelMutedClass}`}>
            Refetch balances, NFTs, tokens, and activity from the RPC without reloading the page.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={`mt-3 ${settingsPanelButtonClass}`}
            onClick={refreshPortfolio}
          >
            <RefreshCw className="h-4 w-4" />
            Refresh portfolio
          </Button>
        </section>

        <section className={settingsPanelClass}>
          <h2 className={settingsPanelTitleClass}>About</h2>
          <p className={`mt-2 ${settingsPanelMutedClass}`}>
            SolVault is a self-custodial Solana portfolio: NFTs, tokens, sends, and optional Anchor
            vault. Connect with Phantom, Solflare, or Backpack.
          </p>
        </section>

        <RpcPickerSection />
      </main>
    </div>
  );
}
