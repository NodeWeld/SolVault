"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PortfolioSidebarBody } from "@/components/layout/PortfolioSidebarBody";

interface MobileWalletsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileWalletsSheet({ open, onOpenChange }: MobileWalletsSheetProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto border-border-subtle bg-[#0c101a] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-solana-green">Wallets</DialogTitle>
        </DialogHeader>
        <PortfolioSidebarBody
          onWalletPicked={() => onOpenChange(false)}
          scrollAreaClassName="max-h-[50vh]"
        />
      </DialogContent>
    </Dialog>
  );
}
