"use client";

import { useConnection } from "@solana/wallet-adapter-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PublicKey } from "@solana/web3.js";
import type { WalletContextState } from "@solana/wallet-adapter-react";
import { buildNftTransferTransaction } from "@/lib/transfer";

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

      const tx = await buildNftTransferTransaction({
        connection,
        mint: mintPk,
        sender: publicKey,
        recipient: recipientPk,
        feePayer: publicKey,
      });

      const sig = await sendTransaction(tx, connection, {
        skipPreflight: false,
        preflightCommitment: "confirmed",
        maxRetries: 3,
      });

      const latest = await connection.getLatestBlockhash("confirmed");
      await connection.confirmTransaction(
        { signature: sig, blockhash: latest.blockhash, lastValidBlockHeight: latest.lastValidBlockHeight },
        "confirmed"
      );

      return { signature: sig };
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["nfts", variables.senderAddress] });
    },
  });
}
