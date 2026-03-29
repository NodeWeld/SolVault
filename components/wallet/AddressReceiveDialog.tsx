"use client";

import { useState, useCallback } from "react";
import QRCode from "react-qr-code";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Copy } from "lucide-react";

interface AddressReceiveDialogProps {
  address: string;
  triggerLabel?: string;
  triggerClassName?: string;
  size?: "default" | "sm";
}

export function AddressReceiveDialog({
  address,
  triggerLabel = "Receive",
  triggerClassName,
  size = "default",
}: AddressReceiveDialogProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, [address]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size={size === "sm" ? "sm" : "default"}
          className={triggerClassName}
        >
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="border-border-subtle bg-[#0c101a] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Receive</DialogTitle>
          <DialogDescription>
            Send SOL or tokens to this Solana address. Scan the QR code or copy the address.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-2">
          <div className="rounded-xl border border-border-subtle bg-white p-3">
            <QRCode value={address} size={200} />
          </div>
          <p className="w-full break-all rounded-md border border-border-subtle bg-black/30 p-3 font-mono text-[11px] text-muted-foreground">
            {address}
          </p>
          <Button type="button" className="w-full sm:w-auto" onClick={() => void copy()}>
            {copied ? "Copied" : "Copy address"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface CopyAddressButtonProps {
  address: string;
  size?: "default" | "sm" | "icon";
  className?: string;
}

export function CopyAddressButton({ address, size = "sm", className }: CopyAddressButtonProps) {
  const [copied, setCopied] = useState(false);

  const onCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, [address]);

  return (
    <Button
      type="button"
      variant="outline"
      size={size === "icon" ? "icon" : size}
      className={className}
      onClick={() => void onCopy()}
      title="Copy address"
      aria-label="Copy wallet address"
    >
      {size === "icon" ? (
        copied ? (
          <Check className="h-4 w-4 text-solana-green" />
        ) : (
          <Copy className="h-4 w-4" />
        )
      ) : copied ? (
        "Copied"
      ) : (
        "Copy"
      )}
    </Button>
  );
}
