"use client";

import { useEffect, useRef, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
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
import { RecipientAddressField } from "@/components/transfer/RecipientAddressField";
import { useSendSplToken } from "@/hooks/useSendSplToken";
import {
  buildFungibleSplTransferTransaction,
  parseTokenAmountToRaw,
} from "@/lib/sol-transfer";
import { simulateLegacyForReview } from "@/lib/simulate-transaction";
import { buildSplTransferSummaryLines } from "@/lib/tx-review-summary";
import { TransactionReviewPanel } from "@/components/transfer/TransactionReviewPanel";
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
  const { connection } = useConnection();
  const wallet = useWallet();
  const mutation = useSendSplToken();
  const resetMutationRef = useRef(mutation.reset);
  resetMutationRef.current = mutation.reset;
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<"form" | "review" | "success">("form");
  const [reviewLines, setReviewLines] = useState<string[]>([]);
  const [sig, setSig] = useState<string | null>(null);
  const [simBusy, setSimBusy] = useState(false);

  useEffect(() => {
    if (!open) {
      setRecipient("");
      setAmount("");
      setError(null);
      setPhase("form");
      setReviewLines([]);
      setSig(null);
      setSimBusy(false);
      resetMutationRef.current();
    } else if (token) {
      setAmount(token.uiAmount);
    }
  }, [open, token]);

  async function prepareReview(e: React.FormEvent) {
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
    const pk = wallet.publicKey;
    if (!pk) {
      setError("Connect a wallet first");
      return;
    }
    setError(null);
    setSimBusy(true);
    try {
      const mintPk = new PublicKey(token.mint);
      const recipientPk = new PublicKey(recipient.trim());
      const amountRaw = parseTokenAmountToRaw(a, token.decimals);
      const { transaction: tx } = await buildFungibleSplTransferTransaction({
        connection,
        mint: mintPk,
        sender: pk,
        recipient: recipientPk,
        amountRaw,
        feePayer: pk,
      });
      const meta = await simulateLegacyForReview(connection, tx);
      setReviewLines(
        buildSplTransferSummaryLines({
          symbol: `SPL (${shortMint(token.mint)})`,
          mint: token.mint,
          amountUi: a,
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

  function runSend() {
    if (!token) return;
    setError(null);
    mutation.mutate(
      {
        mint: token.mint,
        recipient: recipient.trim(),
        amountUi: amount.trim(),
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
              onSubmit={prepareReview}
            >
              <DialogHeader>
                <DialogTitle>Send token</DialogTitle>
                <DialogDescription>
                  Mint <span className="font-mono text-[11px]">{shortMint(token.mint)}</span> — balance{" "}
                  <span className="font-mono">{token.uiAmount}</span> (decimals {token.decimals}). Typical
                  network fee ≈ {feeSol.toFixed(6)} SOL; exact fee after simulation.
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
                <RecipientAddressField
                  id="spl-recv"
                  label="Recipient"
                  value={recipient}
                  onChange={setRecipient}
                  onClearError={() => setError(null)}
                />
                {error ? <p className="text-sm text-red-400">{error}</p> : null}
              </div>
              <DialogFooter>
                <Button type="submit" disabled={simBusy}>
                  {simBusy ? (
                    <>
                      <Loader2 className="animate-spin" />
                      Simulating…
                    </>
                  ) : (
                    "Review transaction"
                  )}
                </Button>
              </DialogFooter>
            </m.form>
          ) : null}

          {phase === "review" && token ? (
            <m.div
              key="review"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              <TransactionReviewPanel
                title="Send token"
                lines={reviewLines}
                onBack={() => {
                  setPhase("form");
                  setError(null);
                }}
                onConfirm={runSend}
                confirming={mutation.isPending}
              />
              {error ? <p className="text-sm text-red-400">{error}</p> : null}
            </m.div>
          ) : null}

          {phase === "success" ? (
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
          ) : null}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
