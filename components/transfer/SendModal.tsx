"use client";

import { useEffect, useRef, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "framer-motion";
import type { NFT } from "@/types";
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
import { useSendNFT } from "@/hooks/useSendNFT";
import { solscanTxUrl } from "@/lib/solscan";
import { Loader2 } from "lucide-react";

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

interface SendModalProps {
  nft: NFT;
  open: boolean;
  onClose: () => void;
  senderAddress: string;
}

export function SendModal({ nft, open, onClose, senderAddress }: SendModalProps) {
  const wallet = useWallet();
  const mutation = useSendNFT();
  const resetMutationRef = useRef(mutation.reset);
  resetMutationRef.current = mutation.reset;
  const [recipient, setRecipient] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<"form" | "success">("form");
  const [sig, setSig] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setRecipient("");
      setError(null);
      setPhase("form");
      setSig(null);
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
    setError(null);
    mutation.mutate(
      {
        mint: nft.mint,
        recipient: recipient.trim(),
        wallet,
        senderAddress,
      },
      {
        onSuccess: (data) => {
          setSig(data.signature);
          setPhase("success");
          void confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
        },
        onError: (err) => {
          setError(err instanceof Error ? err.message : String(err));
        },
      }
    );
  }

  const feeSol = 5000 / LAMPORTS_PER_SOL;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <AnimatePresence mode="wait">
          {phase === "form" ? (
            <motion.form
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onSubmit={onSubmit}
            >
              <DialogHeader>
                <DialogTitle>Send NFT</DialogTitle>
                <DialogDescription>
                  Transfer this NFT to another Solana wallet. You will approve one transaction in
                  your wallet.
                </DialogDescription>
              </DialogHeader>
              <div className="mt-2 flex gap-3 rounded-lg border border-border-subtle bg-surface/50 p-3">
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-md border border-border-subtle bg-black/40">
                  {nft.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={nft.image} alt="" className="h-full w-full object-cover" />
                  ) : null}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-semibold">{nft.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {nft.collection ?? "Uncategorized"}
                  </p>
                </div>
              </div>
              <div className="grid gap-2 py-3">
                <Label htmlFor="recv">Recipient</Label>
                <Input
                  id="recv"
                  className="font-mono text-xs"
                  placeholder="Wallet address"
                  value={recipient}
                  onChange={(e) => {
                    setRecipient(e.target.value);
                    setError(null);
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  Estimated network fee ≈ {feeSol.toFixed(6)} SOL (5000 lamports typical; actual fee
                  depends on priority fees and accounts).
                </p>
                {error ? <p className="text-sm text-red-400">{error}</p> : null}
              </div>
              <DialogFooter>
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending ? (
                    <>
                      <Loader2 className="animate-spin" />
                      Awaiting wallet signature…
                    </>
                  ) : (
                    "Confirm send"
                  )}
                </Button>
              </DialogFooter>
            </motion.form>
          ) : (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <DialogHeader>
                <DialogTitle>Sent</DialogTitle>
                <DialogDescription>
                  Your NFT transfer was submitted to the network.
                </DialogDescription>
              </DialogHeader>
              {sig ? (
                <p className="py-3 text-sm">
                  <a
                    href={solscanTxUrl(sig)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-solana-green underline"
                  >
                    View on Solscan
                  </a>
                </p>
              ) : null}
              <DialogFooter>
                <Button type="button" onClick={onClose}>
                  Close
                </Button>
              </DialogFooter>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
