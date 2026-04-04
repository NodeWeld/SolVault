"use client";

import { useEffect, useState } from "react";
import { WalletMultiButton, useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Button } from "@/components/ui/button";

const multiClass =
  "!h-9 !rounded-md !bg-solana-purple !px-4 !font-sans !text-sm !font-semibold hover:!bg-solana-purple/90";

function SelectWalletFallback() {
  const { setVisible } = useWalletModal();
  return (
    <Button
      type="button"
      className="h-9 shrink-0 rounded-md bg-solana-purple px-4 font-sans text-sm font-semibold text-white hover:bg-solana-purple/90"
      onClick={() => setVisible(true)}
    >
      Select Wallet
    </Button>
  );
}

/**
 * Avoid `dynamic(..., { ssr: false })` here: it leaves an empty slot until a lazy
 * chunk runs, which hard refresh can delay or skip. We SSR/hydrate a stable
 * fallback, then swap to WalletMultiButton after mount so adapter state matches the client.
 */
export function WalletButton() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  if (!ready) {
    return <SelectWalletFallback />;
  }

  return <WalletMultiButton className={multiClass} />;
}
