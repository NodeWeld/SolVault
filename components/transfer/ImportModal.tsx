"use client";

import { useMemo, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useWalletStore } from "@/store/walletStore";
import { useNFTs, flattenNftPages } from "@/hooks/useNFTs";
import { useBatchSend } from "@/hooks/useBatchSend";
import { Loader2 } from "lucide-react";
import type { NFT } from "@/types";
import { cn } from "@/lib/utils";
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

export function ImportModal() {
  const { publicKey } = useWallet();
  const primary = publicKey?.toBase58() ?? "";
  const wallets = useWalletStore((s) => s.wallets);
  const [open, setOpen] = useState(false);
  const [source, setSource] = useState<string | null>(null);
  const [recipient, setRecipient] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const sourceNftQuery = useNFTs(source);
  const sourceNfts = useMemo(() => flattenNftPages(sourceNftQuery.data), [sourceNftQuery.data]);
  const { isLoading, hasNextPage, isFetchingNextPage, fetchNextPage } = sourceNftQuery;
  const wallet = useWallet();
  const batch = useBatchSend();

  const secondaryWallets = useMemo(
    () => wallets.filter((w) => !w.isOwned && w.address !== primary),
    [wallets, primary]
  );

  function toggleMint(m: string) {
    setPicked((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]));
  }

  function onImport(e: React.FormEvent) {
    e.preventDefault();
    if (!primary) {
      setError("Connect your primary wallet first.");
      return;
    }
    const v = validateRecipient(recipient);
    if (v) {
      setError(v);
      return;
    }
    if (!source) {
      setError("Choose a source wallet");
      return;
    }
    if (!picked.length) {
      setError("Select NFTs to import");
      return;
    }
    if (recipient.trim() !== primary) {
      setError("Import recipient must be your connected primary wallet address.");
      return;
    }
    if (source !== wallet.publicKey?.toBase58()) {
      setError(
        "You must connect the source wallet in Phantom (or another adapter) to sign the outgoing transfers."
      );
      return;
    }
    setError(null);
    batch.mutate(
      {
        mints: picked,
        recipient: recipient.trim(),
        wallet,
        senderAddress: source,
      },
      {
        onSuccess: () => {
          setOpen(false);
          setPicked([]);
          setSource(null);
          setRecipient("");
        },
        onError: (err) => setError(err instanceof Error ? err.message : String(err)),
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm">
          Import from wallet
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <form onSubmit={onImport}>
          <DialogHeader>
            <DialogTitle>Import NFTs</DialogTitle>
            <DialogDescription>
              Move NFTs from a secondary wallet you control into your primary wallet.{" "}
              <span className="font-medium text-amber-200/90">
                You must connect the source wallet to sign.
              </span>
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 py-2">
            <div className="grid gap-2">
              <Label>Source wallet</Label>
              <select
                className="h-9 rounded-md border border-border-subtle bg-surface px-2 text-sm"
                value={source ?? ""}
                onChange={(e) => {
                  setSource(e.target.value || null);
                  setPicked([]);
                }}
              >
                <option value="">Select tracked wallet</option>
                {secondaryWallets.map((w) => (
                  <option key={w.address} value={w.address}>
                    {w.label} — {w.address.slice(0, 4)}…
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="imp-primary">Primary wallet (recipient)</Label>
              <Input
                id="imp-primary"
                readOnly
                className="font-mono text-xs"
                value={primary}
                placeholder="Connect wallet"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="imp-recv">Confirm recipient (must match primary)</Label>
              <Input
                id="imp-recv"
                className="font-mono text-xs"
                placeholder="Paste primary address"
                value={recipient}
                onChange={(e) => {
                  setRecipient(e.target.value);
                  setError(null);
                }}
              />
            </div>

            <ScrollArea className="h-48 rounded-md border border-border-subtle">
              <div className="grid grid-cols-3 gap-2 p-2">
                {isLoading ? (
                  <div className="col-span-3 flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
                    <Loader2 className="animate-spin" /> Loading NFTs…
                  </div>
                ) : sourceNfts.length ? (
                  sourceNfts.map((n: NFT) => {
                    const on = picked.includes(n.mint);
                    return (
                      <button
                        type="button"
                        key={n.mint}
                        onClick={() => toggleMint(n.mint)}
                        className={cn(
                          "overflow-hidden rounded-md border text-left text-[10px] transition-colors",
                          on
                            ? "border-solana-green ring-1 ring-solana-green"
                            : "border-border-subtle hover:border-solana-purple/50"
                        )}
                      >
                        <div className="aspect-square bg-black/40">
                          <NftImage
                            src={n.image}
                            alt=""
                            className="h-full w-full object-cover"
                            emptyClassName="h-full w-full min-h-0 text-[8px]"
                          />
                        </div>
                        <div className="truncate p-1">{n.name}</div>
                      </button>
                    );
                  })
                ) : (
                  <p className="col-span-3 py-6 text-center text-xs text-muted-foreground">
                    {source ? "No NFTs for this address." : "Pick a source wallet."}
                  </p>
                )}
              </div>
            </ScrollArea>

            {hasNextPage ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full"
                disabled={isFetchingNextPage}
                onClick={() => void fetchNextPage()}
              >
                {isFetchingNextPage ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Loading more…
                  </>
                ) : (
                  "Load more NFTs from source"
                )}
              </Button>
            ) : null}

            {error ? <p className="text-sm text-red-400">{error}</p> : null}
          </div>

          <DialogFooter>
            <Button type="submit" disabled={batch.isPending}>
              {batch.isPending ? (
                <>
                  <Loader2 className="animate-spin" />
                  Importing…
                </>
              ) : (
                "Import selected"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
