"use client";

import { useConnection } from "@solana/wallet-adapter-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PublicKey } from "@solana/web3.js";
import type { WalletContextState } from "@solana/wallet-adapter-react";
import { buildBurnNftTransaction } from "@/lib/burn-nft";
import { simulateLegacyTransaction } from "@/lib/simulate-transaction";

export interface BurnNFTParams {
  mint: string;
  wallet: WalletContextState;
  senderAddress: string;
}

export function useBurnNft() {
  const { connection } = useConnection();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ mint, wallet, senderAddress }: BurnNFTParams) => {
      const { publicKey, sendTransaction } = wallet;
      if (!publicKey) throw new Error("Wallet not connected");
      if (!sendTransaction) throw new Error("Wallet cannot send transactions");

      const mintPk = new PublicKey(mint);
      const { transaction, blockhash, lastValidBlockHeight } = await buildBurnNftTransaction({
        connection,
        mint: mintPk,
        owner: publicKey,
        feePayer: publicKey,
      });

      await simulateLegacyTransaction(connection, transaction);

      const sig = await sendTransaction(transaction, connection, {
        skipPreflight: false,
        preflightCommitment: "confirmed",
        maxRetries: 3,
      });

      await connection.confirmTransaction(
        {
          signature: sig,
          blockhash,
          lastValidBlockHeight,
        },
        "confirmed"
      );

      return { signature: sig };
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["nfts", variables.senderAddress] });
    },
  });
}
