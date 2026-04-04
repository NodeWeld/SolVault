"use client";

import {
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface TransactionReviewPanelProps {
  title?: string;
  description?: string;
  lines: string[];
  onBack: () => void;
  onConfirm: () => void;
  confirming: boolean;
  confirmLabel?: string;
}

export function TransactionReviewPanel({
  title = "Review transaction",
  description = "Simulation succeeded. Verify the summary, then approve in your wallet extension.",
  lines,
  onBack,
  onConfirm,
  confirming,
  confirmLabel = "Approve in wallet",
}: TransactionReviewPanelProps) {
  return (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      <ul className="list-disc space-y-1.5 rounded-lg border border-border-subtle bg-surface/50 py-3 pl-8 pr-3 text-sm text-foreground">
        {lines.map((line, i) => (
          <li key={i} className="leading-snug">
            {line}
          </li>
        ))}
      </ul>
      <DialogFooter className="gap-2 sm:gap-0">
        <Button type="button" variant="outline" disabled={confirming} onClick={onBack}>
          Back
        </Button>
        <Button type="button" disabled={confirming} onClick={onConfirm}>
          {confirming ? (
            <>
              <Loader2 className="animate-spin" />
              Waiting for wallet…
            </>
          ) : (
            confirmLabel
          )}
        </Button>
      </DialogFooter>
    </div>
  );
}
