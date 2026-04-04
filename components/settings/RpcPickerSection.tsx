"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { clusterApiUrl } from "@solana/web3.js";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  getRpcEndpointInfo,
  notifyCustomRpcChanged,
  readCustomRpcFromStorage,
  validateCustomRpcUrl,
  writeCustomRpcToStorage,
} from "@/lib/custom-rpc";
import { getRpcUrl } from "@/lib/solana";
import {
  settingsPanelBodyClass,
  settingsPanelButtonClass,
  settingsPanelClass,
  settingsPanelCodeClass,
  settingsPanelFineClass,
  settingsPanelTitleClass,
} from "@/lib/settings-panel";

export function RpcPickerSection() {
  const queryClient = useQueryClient();
  const [input, setInput] = useState("");
  const [info, setInfo] = useState<{ source: "custom" | "default"; url: string }>(() => {
    try {
      return { source: "default", url: getRpcUrl() };
    } catch {
      return { source: "default", url: clusterApiUrl("mainnet-beta") };
    }
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setInfo(getRpcEndpointInfo());
    setInput(readCustomRpcFromStorage() ?? "");
  }, []);

  function applyAndRefresh() {
    const r = validateCustomRpcUrl(input);
    if (!r.ok) {
      setError(r.error);
      return;
    }
    setError(null);
    writeCustomRpcToStorage(r.url);
    notifyCustomRpcChanged();
    setInfo(getRpcEndpointInfo());
    void queryClient.invalidateQueries();
  }

  function clearAndRefresh() {
    setError(null);
    writeCustomRpcToStorage(null);
    setInput("");
    notifyCustomRpcChanged();
    setInfo(getRpcEndpointInfo());
    void queryClient.invalidateQueries();
  }

  return (
    <section className={settingsPanelClass}>
      <h2 className={settingsPanelTitleClass}>Advanced — RPC endpoint</h2>
      <p className={`mt-2 ${settingsPanelBodyClass}`}>
        Override the JSON-RPC URL used by your wallet <strong className="text-solana-green">in this browser</strong>{" "}
        only. Useful for private nodes, Triton, QuickNode, or a different Helius URL.
      </p>
      <ul className={`mt-3 list-disc space-y-1 pl-5 ${settingsPanelFineClass}`}>
        <li>
          <strong className="text-solana-green/90">Server routes</strong> (
          <code className={settingsPanelCodeClass}>/api/nfts</code>,{" "}
          <code className={settingsPanelCodeClass}>/api/tokens</code>, etc.) still use{" "}
          <code className={settingsPanelCodeClass}>NEXT_PUBLIC_RPC_URL</code> and Helius keys from{" "}
          <code className={settingsPanelCodeClass}>.env</code> — this override does not change them.
        </li>
        <li>
          Wrong cluster (mainnet URL while your wallet is on devnet, or the reverse) will cause confusing
          errors or empty balances.
        </li>
        <li>Malicious or broken RPCs can lie about chain state; only use endpoints you trust.</li>
        <li>
          Public Solana RPCs often rate-limit heavily; many do <strong className="text-solana-green/90">not</strong>{" "}
          support DAS — NFT loading may still require Helius on the server.
        </li>
      </ul>

      <div className="mt-4 rounded-md border border-solana-green/20 bg-black/20 p-3">
        <p className={`text-xs font-medium text-solana-green/80`}>Currently used for wallet / transactions</p>
        <p className="mt-1 break-all font-mono text-[11px] text-solana-green/90">{info.url}</p>
        <p className={`mt-1 text-xs ${settingsPanelFineClass}`}>
          Source: {info.source === "custom" ? "Custom (this device)" : "App default (.env)"}
        </p>
      </div>

      <div className="mt-4 grid gap-2">
        <Label htmlFor="custom-rpc" className={settingsPanelFineClass}>
          Custom RPC URL (https recommended)
        </Label>
        <Input
          id="custom-rpc"
          className="border-solana-green/30 bg-black/20 font-mono text-xs text-solana-green placeholder:text-solana-green/40"
          placeholder="https://…"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setError(null);
          }}
        />
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" className={settingsPanelButtonClass} onClick={applyAndRefresh}>
          Save and apply
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={`${settingsPanelButtonClass} border-solana-green/25 opacity-90`}
          onClick={clearAndRefresh}
        >
          Clear override
        </Button>
      </div>
      <p className={`mt-3 ${settingsPanelFineClass}`}>
        Saved only in <code className={settingsPanelCodeClass}>localStorage</code> on this browser. Clear override
        to use <code className={settingsPanelCodeClass}>NEXT_PUBLIC_RPC_URL</code> again.
      </p>
    </section>
  );
}
