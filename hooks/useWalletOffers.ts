"use client";

import { useQuery } from "@tanstack/react-query";
import { getConfiguredCluster } from "@/lib/app-network";

async function fetchOfferMints(address: string): Promise<Set<string>> {
  const res = await fetch(`/api/wallet-offers?address=${encodeURIComponent(address)}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? `Offers request failed (${res.status})`);
  }
  const data = (await res.json()) as { mints?: string[] };
  return new Set(data.mints ?? []);
}

/** Mainnet-only: Magic Eden offers_received maps to mints you may want to highlight. */
export function useWalletOffers(walletAddress: string | null | undefined) {
  const cluster = getConfiguredCluster();

  return useQuery({
    queryKey: ["wallet-offers", walletAddress ?? ""],
    queryFn: () => fetchOfferMints(walletAddress as string),
    enabled:
      cluster === "mainnet-beta" && Boolean(walletAddress && walletAddress.length >= 32),
    staleTime: 120_000,
    refetchOnWindowFocus: false,
  });
}
