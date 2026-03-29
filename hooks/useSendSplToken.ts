"use client";

import { useConnection } from "@solana/wallet-adapter-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PublicKey } from "@solana/web3.js";
import type { WalletContextState } from "@solana/wallet-adapter-react";
import {
  buildFungibleSplTransferTransaction,
  parseTokenAmountToRaw,
} from "@/lib/sol-transfer";
import { simulateLegacyTransaction } from "@/lib/simulate-transaction";

export interface SendSplTokenParams {
  mint: string;
  recipient: string;
  amountUi: string;
  decimals: number;
  wallet: WalletContextState;
  senderAddress: string;
}

export function useSendSplToken() {
  const { connection } = useConnection();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      mint,
      recipient,
      amountUi,
      decimals,
      wallet,
      senderAddress,
    }: SendSplTokenParams) => {
      const { publicKey, sendTransaction } = wallet;
      if (!publicKey) throw new Error("Wallet not connected");
      if (!sendTransaction) throw new Error("Wallet cannot send transactions");

      const mintPk = new PublicKey(mint);
      const recipientPk = new PublicKey(recipient.trim());
      const amountRaw = parseTokenAmountToRaw(amountUi, decimals);

      const tx = await buildFungibleSplTransferTransaction({
        connection,
        mint: mintPk,
        sender: publicKey,
        recipient: recipientPk,
        amountRaw,
        feePayer: publicKey,
      });

      await simulateLegacyTransaction(connection, tx);

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
      void queryClient.invalidateQueries({ queryKey: ["spl-tokens", variables.senderAddress] });
      void queryClient.invalidateQueries({ queryKey: ["address-balance", variables.senderAddress] });
    },
  });
}
