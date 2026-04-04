"use client";

import { useConnection } from "@solana/wallet-adapter-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PublicKey } from "@solana/web3.js";
import type { WalletContextState } from "@solana/wallet-adapter-react";
import {
  buildCloseSplAtasTransaction,
} from "@/lib/close-empty-spl";
import { simulateLegacyTransaction } from "@/lib/simulate-transaction";

const CHUNK = 8;

export interface CloseEmptySplParams {
  atas: string[];
  wallet: WalletContextState;
  ownerAddress: string;
}

export function useCloseEmptySplAtas() {
  const { connection } = useConnection();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ atas, wallet, ownerAddress }: CloseEmptySplParams) => {
      const { publicKey, sendTransaction } = wallet;
      if (!publicKey) throw new Error("Wallet not connected");
      if (!sendTransaction) throw new Error("Wallet cannot send transactions");

      const owner = new PublicKey(ownerAddress);
      if (!publicKey.equals(owner)) throw new Error("Active wallet must match the address you are reclaiming for");

      for (let i = 0; i < atas.length; i += CHUNK) {
        const chunk = atas.slice(i, i + CHUNK).map((a) => new PublicKey(a));
        const tx = await buildCloseSplAtasTransaction({
          connection,
          owner,
          feePayer: publicKey,
          atas: chunk,
        });
        await simulateLegacyTransaction(connection, tx);
        const sig = await sendTransaction(tx, connection, {
          skipPreflight: false,
          preflightCommitment: "confirmed",
          maxRetries: 3,
        });
        const latest = await connection.getLatestBlockhash("confirmed");
        await connection.confirmTransaction(
          {
            signature: sig,
            blockhash: latest.blockhash,
            lastValidBlockHeight: latest.lastValidBlockHeight,
          },
          "confirmed"
        );
      }

      return { closed: atas.length };
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["spl-tokens", variables.ownerAddress] });
      void queryClient.invalidateQueries({ queryKey: ["nfts", variables.ownerAddress] });
      void queryClient.invalidateQueries({
        queryKey: ["empty-spl-atas", variables.ownerAddress],
      });
    },
  });
}
