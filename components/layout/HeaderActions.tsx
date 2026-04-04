"use client";

import { useMemo, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { Button } from "@/components/ui/button";
import { SendSolModal } from "@/components/transfer/SendSolModal";
import { useAddressBalance } from "@/hooks/useAddressBalance";

interface HeaderActionsProps {
  connectedAddress: string | null;
}

export function HeaderActions({ connectedAddress }: HeaderActionsProps) {
  const { publicKey } = useWallet();
  const [solOpen, setSolOpen] = useState(false);
  const primary = publicKey?.toBase58() ?? "";
  const { data: bal } = useAddressBalance(connectedAddress);

  const maxSolSendHint = useMemo(() => {
    if (bal?.lamports == null) return undefined;
    const reserve = 10_000;
    const lamports = Math.max(0, bal.lamports - reserve);
    return lamports / LAMPORTS_PER_SOL;
  }, [bal?.lamports]);

  if (!connectedAddress) return null;

  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="secondary"
        className="h-8 bg-solana-purple/90 text-xs text-white hover:bg-solana-purple"
        onClick={() => setSolOpen(true)}
      >
        Send
      </Button>
      <SendSolModal
        open={solOpen}
        onClose={() => setSolOpen(false)}
        senderAddress={primary}
        maxSolHint={maxSolSendHint}
      />
    </>
  );
}
