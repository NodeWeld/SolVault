import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SolVault — Solana NFT Wallet",
    short_name: "SolVault",
    description: "Solana NFT portfolio, SPL tokens, transfers, and wallet dashboard.",
    start_url: "/",
    display: "standalone",
    background_color: "#080B12",
    theme_color: "#9945ff",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
