"use client";

import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useConnection } from "@solana/wallet-adapter-react";
import { useQuery } from "@tanstack/react-query";
import { useSolPrice } from "@/hooks/useSolPrice";

export interface BalanceResult {
  lamports: number;
  sol: number;
  usd: number | null;
}

export function useBalance(publicKey: import("@solana/web3.js").PublicKey | null) {
  const { connection } = useConnection();
  const { data: price } = useSolPrice();

  return useQuery({
    queryKey: ["balance", publicKey?.toBase58() ?? ""],
    queryFn: async (): Promise<BalanceResult> => {
      if (!publicKey) {
        return { lamports: 0, sol: 0, usd: null };
      }
      const lamports = await connection.getBalance(publicKey, "confirmed");
      const sol = lamports / LAMPORTS_PER_SOL;
      const usd = price?.usd != null ? sol * price.usd : null;
      return { lamports, sol, usd };
    },
    enabled: Boolean(publicKey),
    staleTime: 30_000,
    refetchInterval: 45_000,
  });
}
