"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import type { NFT } from "@/types";

export interface NftsPageResponse {
  nfts: NFT[];
  page: number;
  limit: number;
  total?: number;
}

async function fetchNFTsPage(address: string, page: number): Promise<NftsPageResponse> {
  const res = await fetch("/api/nfts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address, page }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? `Failed to load NFTs (${res.status})`);
  }
  return res.json() as Promise<NftsPageResponse>;
}

export function useNFTs(walletAddress: string | null | undefined) {
  return useInfiniteQuery({
    queryKey: ["nfts", walletAddress ?? ""],
    queryFn: ({ pageParam }) => fetchNFTsPage(walletAddress as string, pageParam as number),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { nfts, page, limit, total } = lastPage;
      if (nfts.length < limit) return undefined;
      if (total != null && page * limit >= total) return undefined;
      return page + 1;
    },
    enabled: Boolean(walletAddress && walletAddress.length >= 32),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}

export function flattenNftPages(
  data: { pages: NftsPageResponse[] } | undefined
): NFT[] {
  if (!data?.pages.length) return [];
  return data.pages.flatMap((p) => p.nfts);
}
