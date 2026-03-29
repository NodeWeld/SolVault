"use client";

import { useMemo, useState } from "react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAddressBalance } from "@/hooks/useAddressBalance";
import { useSplTokens } from "@/hooks/useSplTokens";
import { SendSolModal } from "@/components/transfer/SendSolModal";
import { SendSplModal } from "@/components/transfer/SendSplModal";
import type { SplTokenBalance } from "@/types";

const panel =
  "border border-blue-800/50 bg-blue-950/90 text-solana-green shadow-md shadow-blue-950/30 backdrop-blur-sm";

function shortMint(m: string) {
  return m.length <= 14 ? m : `${m.slice(0, 4)}…${m.slice(-4)}`;
}

interface TokensPanelProps {
  viewAddress: string | null;
  canSend: boolean;
  senderAddress: string;
}

export function TokensPanel({ viewAddress, canSend, senderAddress }: TokensPanelProps) {
  const { data: bal, isLoading: balLoading } = useAddressBalance(viewAddress);
  const { data: tokens = [], isLoading: tokLoading, error: tokError } = useSplTokens(viewAddress);

  const [solOpen, setSolOpen] = useState(false);
  const [splToken, setSplToken] = useState<SplTokenBalance | null>(null);
  const [splOpen, setSplOpen] = useState(false);

  const maxSolSendHint = useMemo(() => {
    if (bal?.lamports == null) return undefined;
    const reserve = 10_000;
    const lamports = Math.max(0, bal.lamports - reserve);
    return lamports / LAMPORTS_PER_SOL;
  }, [bal?.lamports]);

  function openSpl(t: SplTokenBalance) {
    setSplToken(t);
    setSplOpen(true);
  }

  return (
    <>
      <Card className={panel}>
        <CardHeader className="pb-2">
          <CardTitle className="font-display text-base text-solana-green">Tokens</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          <p className="text-xs text-solana-green/65">
            Fungible SPL balances (NFT-style 1-of-1 accounts are hidden). Native SOL is shown below.
          </p>

          <div className="rounded-lg border border-blue-800/40 bg-blue-900/35 px-3 py-2 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-solana-green/75">
                  SOL
                </p>
                <p className="font-mono text-solana-green">
                  {balLoading ? "…" : bal?.sol != null ? bal.sol.toFixed(6) : "—"}
                </p>
                {bal?.usd != null ? (
                  <p className="text-xs text-solana-green/60">≈ ${bal.usd.toFixed(2)} USD</p>
                ) : null}
              </div>
              {canSend ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="border-blue-700/40 text-solana-green hover:bg-blue-900/50"
                  onClick={() => setSolOpen(true)}
                >
                  Send SOL
                </Button>
              ) : (
                <span className="text-[10px] text-solana-green/55">Connect as this wallet to send</span>
              )}
            </div>
          </div>

          {tokLoading ? (
            <p className="text-sm text-solana-green/70">Loading SPL tokens…</p>
          ) : tokError ? (
            <p className="text-sm text-red-400">
              {tokError instanceof Error ? tokError.message : "Could not load tokens"}
            </p>
          ) : tokens.length === 0 ? (
            <p className="text-sm text-solana-green/65">No fungible SPL token accounts found.</p>
          ) : (
            <ul className="max-h-48 space-y-2 overflow-auto text-xs">
              {tokens.map((t) => (
                <li
                  key={t.ata}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-blue-800/40 bg-blue-900/25 px-2 py-2"
                >
                  <div className="min-w-0">
                    <p className="font-mono text-[10px] text-solana-green/80" title={t.mint}>
                      {shortMint(t.mint)}
                    </p>
                    <p className="font-mono text-solana-green">{t.uiAmount}</p>
                  </div>
                  {canSend ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="shrink-0 text-solana-green hover:bg-blue-900/40"
                      onClick={() => openSpl(t)}
                    >
                      Send
                    </Button>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <SendSolModal
        open={solOpen}
        onClose={() => setSolOpen(false)}
        senderAddress={senderAddress}
        maxSolHint={maxSolSendHint}
      />
      <SendSplModal
        token={splToken}
        open={splOpen}
        onClose={() => {
          setSplOpen(false);
          setSplToken(null);
        }}
        senderAddress={senderAddress}
      />
    </>
  );
}
