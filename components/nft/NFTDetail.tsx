"use client";

import { useEffect, useState } from "react";
import { m, AnimatePresence } from "framer-motion";
import { useWallet } from "@solana/wallet-adapter-react";
import { Check, Copy } from "lucide-react";
import type { NFT } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SendModal } from "@/components/transfer/SendModal";
import { MarketplaceLinks } from "@/components/nft/MarketplaceLinks";
import { useVaultProgram } from "@/hooks/useVaultProgram";
import { useBurnNft } from "@/hooks/useBurnNft";
import { collectionDisplayLabel } from "@/lib/nft-filters";
import { NftImage } from "@/components/nft/NftImage";
import { cn } from "@/lib/utils";

interface NFTDetailProps {
  nft: NFT | null;
  open: boolean;
  onClose: () => void;
  viewAddress: string | null;
  connectedAddress: string | null;
  /** Mainnet / Magic Eden offers_received best-effort. */
  hasOffer?: boolean;
}

function DetailSection({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-xl border border-white/[0.07] bg-gradient-to-b from-slate-900/35 to-slate-950/60 p-4",
        className
      )}
    >
      <h3 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {title}
      </h3>
      {description ? (
        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground/90">{description}</p>
      ) : null}
      <div className={cn(description ? "mt-3" : "mt-2.5")}>{children}</div>
    </section>
  );
}

export function NFTDetail({
  nft,
  open,
  onClose,
  viewAddress,
  connectedAddress,
  hasOffer = false,
}: NFTDetailProps) {
  const wallet = useWallet();
  const [sendOpen, setSendOpen] = useState(false);
  const [mintCopied, setMintCopied] = useState(false);
  const { depositNFT, withdrawNFT, programId } = useVaultProgram();
  const burnMutation = useBurnNft();
  const [vaultBusy, setVaultBusy] = useState<"dep" | "wd" | null>(null);
  const [vaultErr, setVaultErr] = useState<string | null>(null);
  const [burnAckIrreversible, setBurnAckIrreversible] = useState(false);
  const [burnAckLegacy, setBurnAckLegacy] = useState(false);
  const [burnAckNoUndo, setBurnAckNoUndo] = useState(false);

  const canAct =
    Boolean(viewAddress && connectedAddress && viewAddress === connectedAddress);
  const showVault = canAct && programId;

  useEffect(() => {
    setBurnAckIrreversible(false);
    setBurnAckLegacy(false);
    setBurnAckNoUndo(false);
    setMintCopied(false);
  }, [nft?.mint]);

  const burnAcknowledged =
    burnAckIrreversible && burnAckLegacy && burnAckNoUndo && canAct && nft && !nft.compressed;

  async function copyMintAddress() {
    if (!nft?.mint || !navigator.clipboard?.writeText) return;
    await navigator.clipboard.writeText(nft.mint);
    setMintCopied(true);
    window.setTimeout(() => setMintCopied(false), 2000);
  }

  async function onDeposit() {
    if (!nft) return;
    setVaultErr(null);
    setVaultBusy("dep");
    try {
      await depositNFT(nft.mint);
      onClose();
    } catch (e) {
      setVaultErr(e instanceof Error ? e.message : String(e));
    } finally {
      setVaultBusy(null);
    }
  }

  async function onWithdraw() {
    if (!nft) return;
    setVaultErr(null);
    setVaultBusy("wd");
    try {
      await withdrawNFT(nft.mint);
      onClose();
    } catch (e) {
      setVaultErr(e instanceof Error ? e.message : String(e));
    } finally {
      setVaultBusy(null);
    }
  }

  async function onBurnNft() {
    if (!nft || !connectedAddress) return;
    try {
      await burnMutation.mutateAsync({
        mint: nft.mint,
        wallet,
        senderAddress: connectedAddress,
      });
      onClose();
    } catch {
      /* mutation surfaces via isError */
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
        <DialogContent
          className={cn(
            "flex max-h-[min(92vh,860px)] w-[calc(100vw-1.25rem)] max-w-lg flex-col gap-0 overflow-hidden p-0",
            "border-white/10 bg-[#070b12] shadow-2xl sm:max-w-2xl sm:rounded-2xl"
          )}
        >
          <AnimatePresence mode="wait">
            {nft ? (
              <m.div
                key={nft.mint}
                className="flex min-h-0 flex-1 flex-col"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <DialogHeader className="shrink-0 space-y-0 border-b border-white/[0.06] px-5 pb-4 pt-5 text-left sm:px-6 sm:pb-5 sm:pt-6">
                  <DialogTitle className="pr-10 font-display text-xl font-bold leading-snug tracking-tight text-foreground sm:text-2xl">
                    {nft.name}
                  </DialogTitle>
                  <DialogDescription className="sr-only">
                    NFT details and actions for {nft.name}
                  </DialogDescription>
                  <div className="mt-3 flex max-w-full items-center gap-2">
                    <span
                      className="min-w-0 flex-1 truncate rounded-lg bg-black/45 px-2.5 py-1.5 font-mono text-[11px] text-muted-foreground ring-1 ring-white/[0.06]"
                      title={nft.mint}
                    >
                      {nft.mint}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 shrink-0 text-muted-foreground hover:bg-white/5 hover:text-foreground"
                      onClick={() => void copyMintAddress()}
                      aria-label="Copy mint address"
                    >
                      {mintCopied ? (
                        <Check className="h-4 w-4 text-solana-green" aria-hidden />
                      ) : (
                        <Copy className="h-4 w-4" aria-hidden />
                      )}
                    </Button>
                  </div>
                </DialogHeader>

                <div className="grid min-h-0 flex-1 overflow-hidden sm:grid-cols-[minmax(0,240px)_1fr] md:grid-cols-[minmax(0,280px)_1fr]">
                  <div className="flex items-start justify-center border-b border-white/[0.06] bg-black/25 p-5 sm:border-b-0 sm:border-r sm:p-6">
                    <div className="aspect-square w-full max-w-[200px] overflow-hidden rounded-xl ring-1 ring-white/10 sm:max-w-none">
                      <NftImage
                        src={nft.image}
                        alt=""
                        className="h-full min-h-[140px] w-full object-cover"
                        emptyClassName="min-h-[140px] rounded-none bg-slate-950/80"
                      />
                    </div>
                  </div>

                  <div className="flex min-h-0 flex-col gap-4 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6 sm:py-6">
                    <div className="flex flex-wrap gap-1.5">
                      {nft.collection ? (
                        <Badge variant="outline" className="border-white/15 font-normal" title={nft.collection}>
                          {collectionDisplayLabel(nft)}
                        </Badge>
                      ) : null}
                      {nft.symbol ? (
                        <Badge variant="secondary" className="font-normal">
                          {nft.symbol}
                        </Badge>
                      ) : null}
                      {nft.compressed ? <Badge className="font-normal">cNFT</Badge> : null}
                      {hasOffer ? (
                        <Badge className="border-amber-500/40 bg-amber-950/70 font-normal text-amber-100">
                          Offer
                        </Badge>
                      ) : null}
                    </div>

                    {hasOffer ? (
                      <p className="rounded-lg border border-amber-500/20 bg-amber-950/20 px-3 py-2 text-[11px] leading-relaxed text-amber-100/90">
                        Magic Eden may show an offer on this mint (mainnet, best-effort). Confirm on
                        the marketplace before selling or transferring.
                      </p>
                    ) : null}

                    <Button
                      type="button"
                      size="lg"
                      className="h-11 w-full font-semibold shadow-md shadow-solana-purple/15"
                      onClick={() => setSendOpen(true)}
                      disabled={!canAct}
                    >
                      Send NFT
                    </Button>
                    {!canAct ? (
                      <p className="text-center text-[11px] text-muted-foreground">
                        Connect the wallet you&apos;re viewing to send this NFT.
                      </p>
                    ) : null}

                    <DetailSection title="Attributes">
                      <ul className="max-h-36 space-y-0 overflow-y-auto text-xs">
                        {nft.attributes.length ? (
                          nft.attributes.map((a, i) => (
                            <li
                              key={i}
                              className="flex justify-between gap-3 border-b border-white/[0.05] py-2 last:border-0"
                            >
                              <span className="text-muted-foreground">{a.trait_type}</span>
                              <span className="shrink-0 text-right font-mono text-[11px] text-foreground/90">
                                {String(a.value)}
                              </span>
                            </li>
                          ))
                        ) : (
                          <li className="py-1 text-muted-foreground">No on-chain attributes</li>
                        )}
                      </ul>
                    </DetailSection>

                    <DetailSection
                      title="Marketplaces"
                      description="Open listings on external sites (read-only links)."
                    >
                      <MarketplaceLinks mint={nft.mint} embedded />
                    </DetailSection>

                    <DetailSection
                      title="Vault"
                      description="Optional on-chain vault program—separate from sending the NFT."
                    >
                      {vaultErr ? (
                        <p className="mb-3 text-xs text-red-400">{vaultErr}</p>
                      ) : null}
                      {showVault ? (
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            disabled={vaultBusy !== null}
                            onClick={() => void onDeposit()}
                          >
                            {vaultBusy === "dep" ? "Depositing…" : "Deposit"}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="border-white/15"
                            disabled={vaultBusy !== null}
                            onClick={() => void onWithdraw()}
                          >
                            {vaultBusy === "wd" ? "Withdrawing…" : "Withdraw"}
                          </Button>
                        </div>
                      ) : programId ? (
                        <p className="text-xs text-muted-foreground">
                          Connect as this wallet (not read-only view) to use the vault.
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          Set{" "}
                          <span className="font-mono text-solana-green/80">NEXT_PUBLIC_VAULT_PROGRAM_ID</span>{" "}
                          in <span className="font-mono">.env</span> to enable.
                        </p>
                      )}
                      {nft.compressed ? (
                        <p className="mt-3 text-[11px] text-muted-foreground">
                          cNFT vault actions may not apply; use Send for Bubblegum transfers.
                        </p>
                      ) : null}
                    </DetailSection>

                    {!nft.compressed ? (
                      <DetailSection
                        title="Burn"
                        description="Permanently destroys the SPL token and reclaims rent. Cannot be undone."
                        className="border-red-500/25 bg-gradient-to-b from-red-950/30 to-red-950/10"
                      >
                        <div className="space-y-2.5 text-[11px] leading-relaxed text-red-100/95">
                          <label className="flex cursor-pointer items-start gap-2.5">
                            <input
                              type="checkbox"
                              className="mt-0.5 rounded border-red-400/50"
                              checked={burnAckIrreversible}
                              onChange={(e) => setBurnAckIrreversible(e.target.checked)}
                            />
                            <span>I understand this is irreversible.</span>
                          </label>
                          <label className="flex cursor-pointer items-start gap-2.5">
                            <input
                              type="checkbox"
                              className="mt-0.5 rounded border-red-400/50"
                              checked={burnAckLegacy}
                              onChange={(e) => setBurnAckLegacy(e.target.checked)}
                            />
                            <span>
                              This is a classic SPL NFT (not compressed); I accept the risks of custom
                              programs.
                            </span>
                          </label>
                          <label className="flex cursor-pointer items-start gap-2.5">
                            <input
                              type="checkbox"
                              className="mt-0.5 rounded border-red-400/50"
                              checked={burnAckNoUndo}
                              onChange={(e) => setBurnAckNoUndo(e.target.checked)}
                            />
                            <span>SolVault cannot recover burned assets.</span>
                          </label>
                        </div>
                        {burnMutation.isError ? (
                          <p className="mt-3 text-xs text-red-300">
                            {burnMutation.error instanceof Error
                              ? burnMutation.error.message
                              : String(burnMutation.error)}
                          </p>
                        ) : null}
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="mt-4 w-full"
                          disabled={!burnAcknowledged || burnMutation.isPending}
                          onClick={() => void onBurnNft()}
                        >
                          {burnMutation.isPending ? "Burning…" : "Burn permanently"}
                        </Button>
                      </DetailSection>
                    ) : (
                      <p className="rounded-lg border border-white/[0.06] bg-slate-900/30 px-3 py-2 text-center text-[11px] text-muted-foreground">
                        Compressed NFTs can&apos;t be burned here—use a Bubblegum-compatible tool.
                      </p>
                    )}
                  </div>
                </div>
              </m.div>
            ) : null}
          </AnimatePresence>
        </DialogContent>
      </Dialog>

      {nft ? (
        <SendModal
          nft={nft}
          open={sendOpen}
          onClose={() => setSendOpen(false)}
          senderAddress={connectedAddress ?? ""}
        />
      ) : null}
    </>
  );
}
