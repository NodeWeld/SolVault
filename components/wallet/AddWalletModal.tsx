"use client";

import { useState } from "react";
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
import { useWalletStore } from "@/store/walletStore";

function validateAddress(input: string): string | null {
  const t = input.trim();
  if (!t) return "Address is required";
  try {
    new PublicKey(t);
    return null;
  } catch {
    return "Invalid Solana address (base58 public key)";
  }
}

export function AddWalletModal() {
  const addWallet = useWalletStore((s) => s.addWallet);
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err = validateAddress(address);
    if (err) {
      setError(err);
      return;
    }
    addWallet(address.trim(), label || "Wallet", false);
    setOpen(false);
    setLabel("");
    setAddress("");
    setError(null);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full border-border-subtle">
          Add wallet
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>Import secondary wallet</DialogTitle>
            <DialogDescription>
              Track another wallet by address (read-only in the sidebar). Transfers still require
              that wallet to sign in its own session.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="aw-label">Label</Label>
              <Input
                id="aw-label"
                placeholder="e.g. Cold storage"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="aw-addr">Address</Label>
              <Input
                id="aw-addr"
                className="font-mono text-xs"
                placeholder="Base58 public key"
                value={address}
                onChange={(e) => {
                  setAddress(e.target.value);
                  setError(null);
                }}
              />
              {error ? <p className="text-sm text-red-400">{error}</p> : null}
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Save wallet</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
