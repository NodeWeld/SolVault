"use client";

import { useQuery } from "@tanstack/react-query";
import type { SplTokenBalance } from "@/types";

async function fetchTokens(address: string): Promise<SplTokenBalance[]> {
  const params = new URLSearchParams({ address });
  const res = await fetch(`/api/tokens?${params.toString()}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? `Failed to load tokens (${res.status})`);
  }
  const data = (await res.json()) as { tokens: SplTokenBalance[] };
  return data.tokens;
}

export function useSplTokens(walletAddress: string | null | undefined) {
  return useQuery({
    queryKey: ["spl-tokens", walletAddress ?? ""],
    queryFn: () => fetchTokens(walletAddress as string),
    enabled: Boolean(walletAddress && walletAddress.length >= 32),
    staleTime: 45_000,
    refetchOnWindowFocus: false,
  });
}
