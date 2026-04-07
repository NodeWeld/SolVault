"use client";

import { useEffect, useRef, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import confetti from "canvas-confetti";
import { m, AnimatePresence } from "framer-motion";
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
import { RecipientAddressField } from "@/components/transfer/RecipientAddressField";
import { useSendNFT } from "@/hooks/useSendNFT";
import { useSendCompressedNft } from "@/hooks/useSendCompressedNft";
import { buildNftTransferTransaction } from "@/lib/transfer";
import { simulateLegacyForReview } from "@/lib/simulate-transaction";
import { buildNftTransferSummaryLines } from "@/lib/tx-review-summary";
import { TransactionReviewPanel } from "@/components/transfer/TransactionReviewPanel";
import { solscanTxUrl } from "@/lib/solscan";
import { Loader2 } from "lucide-react";
import { collectionDisplayLabel } from "@/lib/nft-filters";
import { NftImage } from "@/components/nft/NftImage";

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
  const { connection } = useConnection();
  const wallet = useWallet();
  const legacySend = useSendNFT();
  const cnftSend = useSendCompressedNft();
  const resetLegacyRef = useRef(legacySend.reset);
  const resetCnftRef = useRef(cnftSend.reset);
  resetLegacyRef.current = legacySend.reset;
  resetCnftRef.current = cnftSend.reset;
  const [recipient, setRecipient] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<"form" | "review" | "success">("form");
  const [reviewLines, setReviewLines] = useState<string[]>([]);
  const [sig, setSig] = useState<string | null>(null);
  const [simBusy, setSimBusy] = useState(false);

  useEffect(() => {
    if (!open) {
      setRecipient("");
      setError(null);
      setPhase("form");
      setReviewLines([]);
      setSig(null);
      setSimBusy(false);
      resetLegacyRef.current();
      resetCnftRef.current();
    }
  }, [open]);

  async function prepareReview(e: React.FormEvent) {
    e.preventDefault();
    const v = validateRecipient(recipient);
    if (v) {
      setError(v);
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
      const r = recipient.trim();
      if (nft.compressed) {
        setReviewLines(
          buildNftTransferSummaryLines({
            name: nft.name,
            mint: nft.mint,
            recipient: r,
            compressed: true,
            feeLamports: null,
            simulated: false,
          })
        );
        setPhase("review");
        return;
      }
      const mintPk = new PublicKey(nft.mint);
      const recipientPk = new PublicKey(r);
      const { transaction: tx } = await buildNftTransferTransaction({
        connection,
        mint: mintPk,
        sender: pk,
        recipient: recipientPk,
        feePayer: pk,
      });
      const meta = await simulateLegacyForReview(connection, tx);
      setReviewLines(
        buildNftTransferSummaryLines({
          name: nft.name,
          mint: nft.mint,
          recipient: r,
          compressed: false,
          feeLamports: meta.feeLamports,
          unitsConsumed: meta.unitsConsumed,
          simulated: true,
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
    setError(null);
    const onSuccess = (data: { signature: string }) => {
      setSig(data.signature);
      setPhase("success");
      void confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
    };
    const showError = (err: unknown) => {
      setError(err instanceof Error ? err.message : String(err));
    };
    const r = recipient.trim();
    if (nft.compressed) {
      cnftSend.mutate(
        { assetId: nft.mint, recipient: r, senderAddress },
        { onSuccess, onError: showError }
      );
    } else {
      legacySend.mutate(
        { mint: nft.mint, recipient: r, wallet, senderAddress },
        { onSuccess, onError: showError }
      );
    }
  }

  const sending = legacySend.isPending || cnftSend.isPending;
  const feeSol = 5000 / LAMPORTS_PER_SOL;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        overlayClassName="z-[100]"
        className="z-[101] max-h-[min(90vh,36rem)] overflow-y-auto border-border-subtle bg-[#0c101a]"
      >
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
                <DialogTitle>Send NFT</DialogTitle>
                <DialogDescription>
                  {nft.compressed
                    ? "Wallet-to-wallet transfer (Bubblegum + Helius DAS). This is not the vault."
                    : "Wallet-to-wallet transfer. This is not the vault. You’ll review a simulation before signing."}
                </DialogDescription>
              </DialogHeader>
              <div className="mt-2 flex gap-3 rounded-lg border border-border-subtle bg-surface/50 p-3">
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-md border border-border-subtle bg-black/40">
                  <NftImage
                    src={nft.image}
                    alt=""
                    className="h-full w-full object-cover"
                    emptyClassName="h-full w-full min-h-0"
                  />
                </div>
                <div className="min-w-0">
                  <p className="truncate font-semibold">{nft.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {collectionDisplayLabel(nft)}
                  </p>
                </div>
              </div>
              <div className="grid gap-2 py-3">
                <RecipientAddressField
                  id="recv"
                  label="Recipient wallet address"
                  placeholder="e.g. ABC…xyz (Solana public key)"
                  value={recipient}
                  onChange={setRecipient}
                  onClearError={() => setError(null)}
                />
                {!nft.compressed ? (
                  <p className="text-xs text-muted-foreground">
                    Estimated network fee ≈ {feeSol.toFixed(6)} SOL (typical base; exact fee after
                    simulation).
                  </p>
                ) : null}
                {error ? <p className="text-sm text-red-400">{error}</p> : null}
              </div>
              <DialogFooter>
                <Button type="submit" disabled={simBusy}>
                  {simBusy ? (
                    <>
                      <Loader2 className="animate-spin" />
                      {nft.compressed ? "Preparing…" : "Simulating…"}
                    </>
                  ) : (
                    "Review transaction"
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
                title="Send NFT"
                description={
                  nft.compressed
                    ? "Confirm the transfer details. Your wallet will show the full Bubblegum transaction."
                    : undefined
                }
                lines={reviewLines}
                onBack={() => {
                  setPhase("form");
                  setError(null);
                }}
                onConfirm={runSend}
                confirming={sending}
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
            </m.div>
          ) : null}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
