"use client";

import { useQuery } from "@tanstack/react-query";
import type { SolPrice } from "@/types";

async function fetchSolPrice(): Promise<SolPrice> {
  const res = await fetch("/api/price");
  if (!res.ok) {
    throw new Error("Failed to fetch SOL price");
  }
  return res.json() as Promise<SolPrice>;
}

export function useSolPrice() {
  return useQuery({
    queryKey: ["sol-price"],
    queryFn: fetchSolPrice,
    staleTime: 60_000,
    refetchInterval: 120_000,
  });
}
