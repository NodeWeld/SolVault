"use client";

import { useConnection } from "@solana/wallet-adapter-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PublicKey } from "@solana/web3.js";
import type { WalletContextState } from "@solana/wallet-adapter-react";
import { buildNftTransferTransaction } from "@/lib/transfer";
import { simulateLegacyTransaction } from "@/lib/simulate-transaction";

export interface SendNFTParams {
  mint: string;
  recipient: string;
  wallet: WalletContextState;
  senderAddress: string;
}

export function useSendNFT() {
  const { connection } = useConnection();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ mint, recipient, wallet, senderAddress }: SendNFTParams) => {
      const { publicKey, sendTransaction } = wallet;
      if (!publicKey) throw new Error("Wallet not connected");
      if (!sendTransaction) throw new Error("Wallet cannot send transactions");

      const mintPk = new PublicKey(mint);
      const recipientPk = new PublicKey(recipient);

      const { transaction, blockhash, lastValidBlockHeight } = await buildNftTransferTransaction({
        connection,
        mint: mintPk,
        sender: publicKey,
        recipient: recipientPk,
        feePayer: publicKey,
      });

      await simulateLegacyTransaction(connection, transaction);

      const sig = await sendTransaction(transaction, connection, {
        skipPreflight: false,
        preflightCommitment: "confirmed",
        maxRetries: 3,
      });

      await connection.confirmTransaction(
        { signature: sig, blockhash, lastValidBlockHeight },
        "confirmed"
      );

      return { signature: sig };
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["nfts", variables.senderAddress] });
    },
  });
}
