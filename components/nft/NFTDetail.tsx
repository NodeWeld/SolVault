"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
import { Separator } from "@/components/ui/separator";
import { SendModal } from "@/components/transfer/SendModal";
import { useVaultProgram } from "@/hooks/useVaultProgram";

interface NFTDetailProps {
  nft: NFT | null;
  open: boolean;
  onClose: () => void;
  viewAddress: string | null;
  connectedAddress: string | null;
}

export function NFTDetail({
  nft,
  open,
  onClose,
  viewAddress,
  connectedAddress,
}: NFTDetailProps) {
  const [sendOpen, setSendOpen] = useState(false);
  const { depositNFT, withdrawNFT, programId } = useVaultProgram();
  const [vaultBusy, setVaultBusy] = useState<"dep" | "wd" | null>(null);
  const [vaultErr, setVaultErr] = useState<string | null>(null);

  const canAct =
    Boolean(viewAddress && connectedAddress && viewAddress === connectedAddress);
  const showVault = canAct && programId;

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

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
        <DialogContent className="max-w-lg border-border-subtle bg-[#0c101a]">
          <AnimatePresence mode="wait">
            {nft ? (
              <motion.div
                key={nft.mint}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
              >
                <DialogHeader>
                  <DialogTitle className="pr-8">{nft.name}</DialogTitle>
                  <DialogDescription className="font-mono text-[11px]">
                    {nft.mint}
                  </DialogDescription>
                </DialogHeader>
                <div className="mt-2 grid gap-4 sm:grid-cols-[1fr_1.1fr]">
                  <div className="overflow-hidden rounded-lg border border-border-subtle bg-black/30">
                    {nft.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={nft.image}
                        alt={nft.name}
                        className="aspect-square w-full object-cover"
                      />
                    ) : (
                      <div className="flex aspect-square items-center justify-center text-xs text-muted-foreground">
                        No image
                      </div>
                    )}
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="flex flex-wrap gap-2">
                      {nft.collection ? <Badge variant="outline">{nft.collection}</Badge> : null}
                      {nft.symbol ? <Badge variant="secondary">{nft.symbol}</Badge> : null}
                      {nft.compressed ? <Badge>cNFT</Badge> : null}
                    </div>
                    <Separator className="bg-border-subtle" />
                    <div>
                      <p className="text-xs font-semibold uppercase text-muted-foreground">
                        Attributes
                      </p>
                      <ul className="mt-2 max-h-32 space-y-1 overflow-auto text-xs">
                        {nft.attributes.length ? (
                          nft.attributes.map((a, i) => (
                            <li key={i} className="flex justify-between gap-2">
                              <span className="text-muted-foreground">{a.trait_type}</span>
                              <span className="font-mono text-[11px]">{String(a.value)}</span>
                            </li>
                          ))
                        ) : (
                          <li className="text-muted-foreground">No on-chain attributes</li>
                        )}
                      </ul>
                    </div>
                    {vaultErr ? <p className="text-xs text-red-400">{vaultErr}</p> : null}
                    <div className="flex flex-col gap-2">
                      <Button
                        type="button"
                        onClick={() => setSendOpen(true)}
                        disabled={!canAct || nft.compressed}
                        className="w-full"
                      >
                        Send NFT
                      </Button>
                      {nft.compressed ? (
                        <p className="text-[11px] text-muted-foreground">
                          Compressed NFT transfers require a dedicated workflow; SPL-token send is
                          disabled here.
                        </p>
                      ) : null}
                      {showVault ? (
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            type="button"
                            variant="secondary"
                            disabled={vaultBusy !== null}
                            onClick={() => void onDeposit()}
                          >
                            {vaultBusy === "dep" ? "Depositing…" : "Vault deposit"}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            disabled={vaultBusy !== null}
                            onClick={() => void onWithdraw()}
                          >
                            {vaultBusy === "wd" ? "Withdrawing…" : "Vault withdraw"}
                          </Button>
                        </div>
                      ) : programId ? (
                        <p className="text-[11px] text-muted-foreground">
                          Connect the wallet you are viewing to use vault actions.
                        </p>
                      ) : (
                        <p className="text-[11px] text-muted-foreground">
                          Set NEXT_PUBLIC_VAULT_PROGRAM_ID to enable on-chain vault instructions.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
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
