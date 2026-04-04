"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Button } from "@/components/ui/button";
import {
  settingsPanelBodyClass,
  settingsPanelButtonClass,
  settingsPanelClass,
  settingsPanelFineClass,
  settingsPanelMutedClass,
  settingsPanelTitleClass,
} from "@/lib/settings-panel";

export function WalletSessionSection() {
  const { connected, disconnect, wallet, publicKey } = useWallet();
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(typeof window !== "undefined" ? window.location.origin : "");
  }, []);

  if (!connected || !publicKey) {
    return (
      <section className={settingsPanelClass}>
        <h2 className={settingsPanelTitleClass}>Connection</h2>
        <p className={`mt-2 ${settingsPanelMutedClass}`}>
          Connect a wallet to see which site and adapter are active.
        </p>
      </section>
    );
  }

  const addr = publicKey.toBase58();

  return (
    <section className={settingsPanelClass}>
      <h2 className={settingsPanelTitleClass}>Connection and site</h2>
      <p className={`mt-2 ${settingsPanelBodyClass}`}>
        <span className="font-semibold text-solana-green">SolVault</span> is the dApp in this tab. Your
        wallet shares your public key with this origin only while connected.
      </p>
      <dl className="mt-3 space-y-2 text-sm">
        <div>
          <dt className={`text-xs ${settingsPanelFineClass}`}>Site (origin)</dt>
          <dd className="break-all font-mono text-[11px] text-solana-green/90">{origin || "—"}</dd>
        </div>
        <div>
          <dt className={`text-xs ${settingsPanelFineClass}`}>Wallet</dt>
          <dd className={settingsPanelBodyClass}>{wallet?.adapter.name ?? "Unknown adapter"}</dd>
        </div>
        <div>
          <dt className={`text-xs ${settingsPanelFineClass}`}>Connected address</dt>
          <dd className="break-all font-mono text-[11px] text-solana-green/90">{addr}</dd>
        </div>
      </dl>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={`mt-4 ${settingsPanelButtonClass}`}
        onClick={() => void disconnect()}
      >
        Disconnect wallet
      </Button>
      <p className={`mt-3 ${settingsPanelFineClass}`}>
        To connect a different address, disconnect here or use your wallet&apos;s account switcher, then
        connect again. Other tabs or sites do not use this session.
      </p>
    </section>
  );
}
