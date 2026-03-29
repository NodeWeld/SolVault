"use client";

import { useEffect, useRef, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import confetti from "canvas-confetti";
import { m, AnimatePresence } from "framer-motion";
import type { SplTokenBalance } from "@/types";
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
import { useSendSplToken } from "@/hooks/useSendSplToken";
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

function shortMint(m: string) {
  return m.length <= 12 ? m : `${m.slice(0, 4)}…${m.slice(-4)}`;
}

interface SendSplModalProps {
  token: SplTokenBalance | null;
  open: boolean;
  onClose: () => void;
  senderAddress: string;
}

export function SendSplModal({ token, open, onClose, senderAddress }: SendSplModalProps) {
  const wallet = useWallet();
  const mutation = useSendSplToken();
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
    } else if (token) {
      setAmount(token.uiAmount);
    }
  }, [open, token]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
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
        mint: token.mint,
        recipient: recipient.trim(),
        amountUi: a,
        decimals: token.decimals,
        wallet,
        senderAddress,
      },
      {
        onSuccess: (data) => {
          setSig(data.signature);
          setPhase("success");
          void confetti({ particleCount: 90, spread: 60, origin: { y: 0.6 } });
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
          {phase === "form" && token ? (
            <m.form
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onSubmit={onSubmit}
            >
              <DialogHeader>
                <DialogTitle>Send token</DialogTitle>
                <DialogDescription>
                  Mint <span className="font-mono text-[11px]">{shortMint(token.mint)}</span> — balance{" "}
                  <span className="font-mono">{token.uiAmount}</span> (decimals {token.decimals}). Network
                  fee ≈ {feeSol.toFixed(6)} SOL.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-3 py-2">
                <div className="grid gap-2">
                  <Label htmlFor="spl-amt">Amount</Label>
                  <Input
                    id="spl-amt"
                    className="font-mono text-sm"
                    value={amount}
                    onChange={(e) => {
                      setAmount(e.target.value);
                      setError(null);
                    }}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="spl-recv">Recipient</Label>
                  <Input
                    id="spl-recv"
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
                    "Send token"
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
                <DialogDescription>Your token transfer was submitted.</DialogDescription>
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
