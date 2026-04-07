"use client";

import { useQuery } from "@tanstack/react-query";

async function fetchPrices(mints: string[]): Promise<Record<string, number | null>> {
  if (!mints.length) return {};
  const params = new URLSearchParams({ mints: mints.join(",") });
  const res = await fetch(`/api/token-prices?${params.toString()}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? `Prices failed (${res.status})`);
  }
  const data = (await res.json()) as { prices: Record<string, number | null> };
  return data.prices ?? {};
}

export function useTokenPrices(mints: string[]) {
  const key = [...new Set(mints)].sort().join(",");
  return useQuery({
    queryKey: ["token-prices", key],
    queryFn: () => fetchPrices(key ? key.split(",") : []),
    enabled: Boolean(key),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}
