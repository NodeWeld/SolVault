"use client";

import dynamic from "next/dynamic";

const WalletMultiButton = dynamic(
  async () => (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false }
);

export function WalletButton() {
  return (
    <WalletMultiButton className="!h-9 !rounded-md !bg-solana-purple !px-4 !font-sans !text-sm !font-semibold hover:!bg-solana-purple/90" />
  );
}
