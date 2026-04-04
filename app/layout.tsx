import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { Syne, DM_Sans, Space_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

/** Code-split wallet + React Query so `app/layout` chunk stays small (avoids ChunkLoadError timeouts). */
const Providers = dynamic(() => import("./providers").then((m) => ({ default: m.Providers })), {
  loading: () => (
    <div
      className="flex min-h-[50vh] items-center justify-center text-sm text-muted-foreground"
      aria-busy="true"
      aria-label="Loading app"
    >
      Loading…
    </div>
  ),
  ssr: true,
});

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  display: "swap",
  preload: true,
  weight: ["700", "800"],
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
  preload: true,
  weight: ["400", "500", "600", "700"],
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  variable: "--font-space-mono",
  display: "swap",
  preload: false,
  adjustFontFallback: true,
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "SolVault — Solana NFT Wallet",
  description: "Production-ready Solana NFT portfolio, transfers, and vault controls.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body
        className={cn(
          "min-h-screen bg-[#080B12] font-sans antialiased",
          syne.variable,
          dmSans.variable,
          spaceMono.variable
        )}
      >
        <div className="app-bg" aria-hidden />
        <div className="orb orb-purple" aria-hidden />
        <div className="orb orb-green" aria-hidden />
        <div className="orb orb-blue" aria-hidden />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
