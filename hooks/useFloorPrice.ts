"use client";

import { useQuery } from "@tanstack/react-query";
import type { FloorPrice } from "@/types";

async function fetchFloor(symbol: string): Promise<FloorPrice> {
  const params = new URLSearchParams({ symbol });
  const res = await fetch(`/api/floor?${params.toString()}`);
  if (!res.ok) {
    throw new Error("Failed to fetch floor price");
  }
  return res.json() as Promise<FloorPrice>;
}

export function useFloorPrice(collectionSymbol: string | null | undefined) {
  return useQuery({
    queryKey: ["floor", collectionSymbol ?? ""],
    queryFn: () => fetchFloor(collectionSymbol as string),
    enabled: Boolean(collectionSymbol && collectionSymbol.length > 0),
    staleTime: 120_000,
  });
}
