"use client";

import { useConnection } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { useQuery } from "@tanstack/react-query";
import { useSolPrice } from "@/hooks/useSolPrice";

export function useAddressBalance(address: string | null | undefined) {
  const { connection } = useConnection();
  const { data: price } = useSolPrice();

  return useQuery({
    queryKey: ["address-balance", address ?? ""],
    queryFn: async () => {
      if (!address) return { lamports: 0, sol: 0, usd: null as number | null };
      const pk = new PublicKey(address);
      const lamports = await connection.getBalance(pk, "confirmed");
      const sol = lamports / LAMPORTS_PER_SOL;
      const usd = price?.usd != null ? sol * price.usd : null;
      return { lamports, sol, usd };
    },
    enabled: Boolean(address && address.length >= 32),
    staleTime: 30_000,
  });
}
