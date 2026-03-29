"use client";

import { useQuery } from "@tanstack/react-query";
import type { ActivityItem } from "@/types";

async function fetchActivity(address: string): Promise<ActivityItem[]> {
  const params = new URLSearchParams({ address });
  const res = await fetch(`/api/activity?${params.toString()}`);
  if (!res.ok) {
    throw new Error("Failed to fetch activity");
  }
  const data = (await res.json()) as { activity: ActivityItem[] };
  return data.activity;
}

export function useActivity(walletAddress: string | null | undefined) {
  return useQuery({
    queryKey: ["activity", walletAddress ?? ""],
    queryFn: () => fetchActivity(walletAddress as string),
    enabled: Boolean(walletAddress && walletAddress.length >= 32),
    staleTime: 45_000,
    refetchOnWindowFocus: false,
  });
}
