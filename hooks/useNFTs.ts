"use client";

import { useQuery } from "@tanstack/react-query";
import type { NFT } from "@/types";

async function fetchNFTs(address: string): Promise<NFT[]> {
  const res = await fetch("/api/nfts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? `Failed to load NFTs (${res.status})`);
  }
  const data = (await res.json()) as { nfts: NFT[] };
  return data.nfts;
}

export function useNFTs(walletAddress: string | null | undefined) {
  return useQuery({
    queryKey: ["nfts", walletAddress ?? ""],
    queryFn: () => fetchNFTs(walletAddress as string),
    enabled: Boolean(walletAddress && walletAddress.length >= 32),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}
