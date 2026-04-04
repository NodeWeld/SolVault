"use client";

import { useEffect, useState } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useQuery } from "@tanstack/react-query";
import { PublicKey } from "@solana/web3.js";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { listEmptyClassicSplAtas } from "@/lib/close-empty-spl";
import { useCloseEmptySplAtas } from "@/hooks/useCloseEmptySplAtas";

interface CloseEmptySplModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ownerAddress: string;
}

export function CloseEmptySplModal({ open, onOpenChange, ownerAddress }: CloseEmptySplModalProps) {
  const { connection } = useConnection();
  const wallet = useWallet();
  const closeMutation = useCloseEmptySplAtas();
  const [ackIrreversible, setAckIrreversible] = useState(false);
  const [ackClassicOnly, setAckClassicOnly] = useState(false);
  const [ackVerify, setAckVerify] = useState(false);

  const listQuery = useQuery({
    queryKey: ["empty-spl-atas", ownerAddress],
    queryFn: () => listEmptyClassicSplAtas(connection, new PublicKey(ownerAddress)),
    enabled: open && ownerAddress.length >= 32,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!open) {
      setAckIrreversible(false);
      setAckClassicOnly(false);
      setAckVerify(false);
    }
  }, [open]);

  const atas = listQuery.data ?? [];
  const canConfirm =
    ackIrreversible &&
    ackClassicOnly &&
    ackVerify &&
    atas.length > 0 &&
    wallet.publicKey?.toBase58() === ownerAddress;

  async function onConfirm() {
    if (!canConfirm) return;
    try {
      await closeMutation.mutateAsync({
        atas: atas.map((a) => a.ata),
        wallet,
        ownerAddress,
      });
      onOpenChange(false);
    } catch {
      /* surfaced below */
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg border-border-subtle bg-[#0c101a]">
        <DialogHeader>
          <DialogTitle className="text-red-200">Close empty SPL token accounts</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Reclaims rent from classic SPL token accounts that report <span className="font-mono">0</span>{" "}
            balance. This does not scan Token-2022 accounts. You will sign one transaction per batch of
            up to eight accounts.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          <div className="rounded-lg border border-red-500/35 bg-red-950/30 p-3 text-[11px] text-red-100/95">
            <p className="font-semibold text-red-200">Read carefully</p>
            <ul className="mt-2 list-inside list-disc space-y-1">
              <li>Closing the wrong account can lock or destroy value if balances are non-zero.</li>
              <li>RPC or parsing bugs, stale data, or hidden token states are your risk.</li>
              <li>Review every mint below; when in doubt, do not proceed.</li>
            </ul>
          </div>

          {listQuery.isLoading ? (
            <p className="text-xs text-muted-foreground">Scanning wallet…</p>
          ) : listQuery.isError ? (
            <p className="text-xs text-red-300">
              {listQuery.error instanceof Error ? listQuery.error.message : "Scan failed"}
            </p>
          ) : atas.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No empty classic SPL token accounts found for this wallet.
            </p>
          ) : (
            <>
              <p className="text-xs font-medium text-solana-green">
                {atas.length} empty account{atas.length === 1 ? "" : "s"} (showing mint)
              </p>
              <ul className="max-h-40 space-y-1 overflow-auto rounded-md border border-border-subtle bg-black/30 p-2 font-mono text-[10px] text-muted-foreground">
                {atas.map((a) => (
                  <li key={a.ata} className="truncate" title={`${a.ata} / ${a.mint}`}>
                    {a.mint}
                  </li>
                ))}
              </ul>
            </>
          )}

          <div className="space-y-2 text-[11px] text-foreground/90">
            <label className="flex cursor-pointer items-start gap-2">
              <input
                type="checkbox"
                className="mt-0.5"
                checked={ackIrreversible}
                onChange={(e) => setAckIrreversible(e.target.checked)}
              />
              <span>I understand closing accounts is on-chain and cannot be undone from SolVault.</span>
            </label>
            <label className="flex cursor-pointer items-start gap-2">
              <input
                type="checkbox"
                className="mt-0.5"
                checked={ackClassicOnly}
                onChange={(e) => setAckClassicOnly(e.target.checked)}
              />
              <span>I confirm I only expect classic SPL Token accounts here (not Token-2022-only flows).</span>
            </label>
            <label className="flex cursor-pointer items-start gap-2">
              <input
                type="checkbox"
                className="mt-0.5"
                checked={ackVerify}
                onChange={(e) => setAckVerify(e.target.checked)}
              />
              <span>I have reviewed the mint list and accept full responsibility for this action.</span>
            </label>
          </div>

          {closeMutation.isError ? (
            <p className="text-xs text-red-300">
              {closeMutation.error instanceof Error
                ? closeMutation.error.message
                : String(closeMutation.error)}
            </p>
          ) : null}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={!canConfirm || closeMutation.isPending}
              onClick={() => void onConfirm()}
            >
              {closeMutation.isPending ? "Closing…" : `Close ${atas.length} account(s)`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
