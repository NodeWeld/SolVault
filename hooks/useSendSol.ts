"use client";

import { useConnection } from "@solana/wallet-adapter-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PublicKey } from "@solana/web3.js";
import type { WalletContextState } from "@solana/wallet-adapter-react";
import { buildSolTransferTransaction, parseSolToLamports } from "@/lib/sol-transfer";
import { simulateLegacyTransaction } from "@/lib/simulate-transaction";

export interface SendSolParams {
  recipient: string;
  amountSol: string;
  wallet: WalletContextState;
  senderAddress: string;
}

export function useSendSol() {
  const { connection } = useConnection();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ recipient, amountSol, wallet, senderAddress }: SendSolParams) => {
      const { publicKey, sendTransaction } = wallet;
      if (!publicKey) throw new Error("Wallet not connected");
      if (!sendTransaction) throw new Error("Wallet cannot send transactions");

      const lamports = parseSolToLamports(amountSol);
      const recipientPk = new PublicKey(recipient.trim());

      const tx = await buildSolTransferTransaction({
        connection,
        from: publicKey,
        to: recipientPk,
        lamports,
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
      void queryClient.invalidateQueries({ queryKey: ["address-balance", variables.senderAddress] });
      void queryClient.invalidateQueries({ queryKey: ["spl-tokens", variables.senderAddress] });
    },
  });
}
