"use client";

import { useEffect, useRef, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import confetti from "canvas-confetti";
import { m, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useBatchSend } from "@/hooks/useBatchSend";
import { useWalletStore } from "@/store/walletStore";
import { Loader2 } from "lucide-react";
import type { BatchSendProgress } from "@/types";
import {
  buildVersionedBatchForMints,
  chunkMints,
  MAX_MINTS_PER_TX,
} from "@/lib/batch";
import { simulateVersionedForReview } from "@/lib/simulate-transaction";
import { buildBatchNftSummaryLines } from "@/lib/tx-review-summary";
import { TransactionReviewPanel } from "@/components/transfer/TransactionReviewPanel";

function validateRecipient(input: string): string | null {
  const t = input.trim();
  if (!t) return "Recipient is required";
  try {
    new PublicKey(t);
    return null;
  } catch {
    return "Invalid recipient address";
  }
}

interface BatchSendModalProps {
  open: boolean;
  onClose: () => void;
  senderAddress: string;
}

export function BatchSendModal({ open, onClose, senderAddress }: BatchSendModalProps) {
  const { connection } = useConnection();
  const wallet = useWallet();
  const selected = useWalletStore((s) => s.selectedNFTs);
  const clearSelection = useWalletStore((s) => s.clearSelection);
  const mutation = useBatchSend();
  const resetMutationRef = useRef(mutation.reset);
  resetMutationRef.current = mutation.reset;
  const [recipient, setRecipient] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<BatchSendProgress | null>(null);
  const [phase, setPhase] = useState<"form" | "review" | "progress">("form");
  const [reviewLines, setReviewLines] = useState<string[]>([]);
  const [simBusy, setSimBusy] = useState(false);

  useEffect(() => {
    if (!open) {
      setRecipient("");
      setError(null);
      setProgress(null);
      setPhase("form");
      setReviewLines([]);
      setSimBusy(false);
      resetMutationRef.current();
    }
  }, [open]);

  async function prepareReview(e: React.FormEvent) {
    e.preventDefault();
    const v = validateRecipient(recipient);
    if (v) {
      setError(v);
      return;
    }
    if (!selected.length) {
      setError("Select at least one NFT");
      return;
    }
    const pk = wallet.publicKey;
    if (!pk) {
      setError("Connect a wallet first");
      return;
    }
    setError(null);
    setSimBusy(true);
    try {
      const recipientPk = new PublicKey(recipient.trim());
      const mintPks = selected.map((m) => new PublicKey(m));
      const batches = chunkMints(mintPks, MAX_MINTS_PER_TX);
      const firstBatch = batches[0];
      if (!firstBatch?.length) {
        setError("No NFTs to send");
        return;
      }
      const vtx = await buildVersionedBatchForMints({
        connection,
        mints: firstBatch,
        sender: pk,
        recipient: recipientPk,
        feePayer: pk,
      });
      const meta = await simulateVersionedForReview(connection, vtx);
      setReviewLines(
        buildBatchNftSummaryLines({
          totalNfts: selected.length,
          txCount: batches.length,
          recipient: recipient.trim(),
          feeLamports: meta.feeLamports,
          unitsConsumed: meta.unitsConsumed,
        })
      );
      setPhase("review");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSimBusy(false);
    }
  }

  function runBatch() {
    setError(null);
    setPhase("progress");
    mutation.mutate(
      {
        mints: selected,
        recipient: recipient.trim(),
        wallet,
        senderAddress,
        onProgress: setProgress,
      },
      {
        onSuccess: () => {
          void confetti({ particleCount: 80, spread: 60, origin: { y: 0.65 } });
          clearSelection();
        },
        onError: (err) => {
          setError(err instanceof Error ? err.message : String(err));
          setPhase("review");
        },
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[min(90vh,32rem)] overflow-y-auto">
        <AnimatePresence mode="wait">
          {phase === "form" ? (
            <m.form
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onSubmit={prepareReview}
            >
              <DialogHeader>
                <DialogTitle>Batch send NFTs</DialogTitle>
                <DialogDescription>
                  Sends up to 5 NFTs per signed transaction. Larger selections are split across multiple
                  transactions with a short delay between each.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-3 py-2">
                <p className="text-sm text-muted-foreground">
                  Selected: <span className="font-mono text-foreground">{selected.length}</span> NFT(s)
                </p>
                <div className="grid gap-2">
                  <Label htmlFor="batch-recv">Recipient</Label>
                  <Input
                    id="batch-recv"
                    className="font-mono text-xs"
                    value={recipient}
                    onChange={(e) => {
                      setRecipient(e.target.value);
                      setError(null);
                    }}
                  />
                </div>
                {error ? <p className="text-sm text-red-400">{error}</p> : null}
              </div>
              <DialogFooter>
                <Button type="submit" disabled={simBusy || !selected.length}>
                  {simBusy ? (
                    <>
                      <Loader2 className="animate-spin" />
                      Simulating first batch…
                    </>
                  ) : (
                    "Review batch"
                  )}
                </Button>
              </DialogFooter>
            </m.form>
          ) : null}

          {phase === "review" ? (
            <m.div
              key="review"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              <TransactionReviewPanel
                title="Batch send NFTs"
                lines={reviewLines}
                onBack={() => {
                  setPhase("form");
                  setError(null);
                }}
                onConfirm={runBatch}
                confirming={mutation.isPending}
                confirmLabel="Sign batch in wallet"
              />
              {error ? <p className="text-sm text-red-400">{error}</p> : null}
            </m.div>
          ) : null}

          {phase === "progress" ? (
            <m.div
              key="progress"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              <DialogHeader>
                <DialogTitle>Sending batch</DialogTitle>
                <DialogDescription>
                  Approve each transaction in your wallet when prompted. This window stays open until all
                  batches finish or you close it.
                </DialogDescription>
              </DialogHeader>
              {progress ? (
                <p className="text-sm text-muted-foreground">
                  Progress: {progress.sent} / {progress.total}
                  {progress.errors.length
                    ? ` — ${progress.errors.length} error(s), see messages below`
                    : ""}
                </p>
              ) : mutation.isPending ? (
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Waiting for wallet…
                </p>
              ) : null}
              {progress?.errors.length ? (
                <ul className="max-h-32 overflow-auto text-xs text-red-300">
                  {progress.errors.slice(0, 8).map((x, i) => (
                    <li key={i} className="font-mono">
                      {shortMintErr(x.mint)}: {x.message}
                    </li>
                  ))}
                </ul>
              ) : null}
              {error ? <p className="text-sm text-red-400">{error}</p> : null}
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  disabled={mutation.isPending}
                  onClick={() => {
                    setPhase("review");
                    setError(null);
                  }}
                >
                  Back to review
                </Button>
                <Button type="button" variant="secondary" onClick={onClose}>
                  Close
                </Button>
              </DialogFooter>
            </m.div>
          ) : null}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

function shortMintErr(m: string) {
  return m.length <= 14 ? m : `${m.slice(0, 4)}…${m.slice(-4)}`;
}
