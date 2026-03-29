"use client";

import { useEffect, useRef, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import confetti from "canvas-confetti";
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
  const wallet = useWallet();
  const selected = useWalletStore((s) => s.selectedNFTs);
  const clearSelection = useWalletStore((s) => s.clearSelection);
  const mutation = useBatchSend();
  const resetMutationRef = useRef(mutation.reset);
  resetMutationRef.current = mutation.reset;
  const [recipient, setRecipient] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<BatchSendProgress | null>(null);

  useEffect(() => {
    if (!open) {
      setRecipient("");
      setError(null);
      setProgress(null);
      resetMutationRef.current();
    }
  }, [open]);

  function onSubmit(e: React.FormEvent) {
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
    setError(null);
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
        },
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <form onSubmit={onSubmit}>
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
            {progress ? (
              <p className="text-xs text-muted-foreground">
                Progress: {progress.sent} / {progress.total}
                {progress.errors.length
                  ? ` — ${progress.errors.length} error(s), see wallet / logs`
                  : ""}
              </p>
            ) : null}
            {error ? <p className="text-sm text-red-400">{error}</p> : null}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={mutation.isPending || !selected.length}>
              {mutation.isPending ? (
                <>
                  <Loader2 className="animate-spin" />
                  Sending batch…
                </>
              ) : (
                "Send batch"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
