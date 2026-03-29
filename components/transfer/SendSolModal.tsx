"use client";

import { useEffect, useRef, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
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
import { useSendSol } from "@/hooks/useSendSol";
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

interface SendSolModalProps {
  open: boolean;
  onClose: () => void;
  senderAddress: string;
  maxSolHint?: number;
}

export function SendSolModal({ open, onClose, senderAddress, maxSolHint }: SendSolModalProps) {
  const wallet = useWallet();
  const mutation = useSendSol();
  const resetMutationRef = useRef(mutation.reset);
  resetMutationRef.current = mutation.reset;
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<"form" | "success">("form");
  const [sig, setSig] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setRecipient("");
      setAmount("");
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
    const a = amount.trim();
    if (!a) {
      setError("Amount is required");
      return;
    }
    setError(null);
    mutation.mutate(
      {
        recipient: recipient.trim(),
        amountSol: a,
        wallet,
        senderAddress,
      },
      {
        onSuccess: (data) => {
          setSig(data.signature);
          setPhase("success");
          void confetti({ particleCount: 100, spread: 65, origin: { y: 0.6 } });
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
            <m.form
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onSubmit={onSubmit}
            >
              <DialogHeader>
                <DialogTitle>Send SOL</DialogTitle>
                <DialogDescription>
                  Transfer native SOL to another wallet. Leave a small buffer for fees (typical base fee
                  ≈ {feeSol.toFixed(6)} SOL).
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-3 py-2">
                {maxSolHint != null ? (
                  <p className="text-xs text-muted-foreground">
                    Available (approx.):{" "}
                    <span className="font-mono text-foreground">{maxSolHint.toFixed(6)} SOL</span> — do
                    not send full balance or the transaction may fail.
                  </p>
                ) : null}
                <div className="grid gap-2">
                  <Label htmlFor="sol-amt">Amount (SOL)</Label>
                  <Input
                    id="sol-amt"
                    className="font-mono text-sm"
                    placeholder="0.01"
                    value={amount}
                    onChange={(e) => {
                      setAmount(e.target.value);
                      setError(null);
                    }}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="sol-recv">Recipient</Label>
                  <Input
                    id="sol-recv"
                    className="font-mono text-xs"
                    placeholder="Wallet address"
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
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending ? (
                    <>
                      <Loader2 className="animate-spin" />
                      Awaiting signature…
                    </>
                  ) : (
                    "Send SOL"
                  )}
                </Button>
              </DialogFooter>
            </m.form>
          ) : (
            <m.div
              key="done"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <DialogHeader>
                <DialogTitle>Sent</DialogTitle>
                <DialogDescription>Your SOL transfer was submitted.</DialogDescription>
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
            </m.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
