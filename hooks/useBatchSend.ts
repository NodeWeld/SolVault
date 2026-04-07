"use client";

import { useConnection } from "@solana/wallet-adapter-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PublicKey } from "@solana/web3.js";
import type { WalletContextState } from "@solana/wallet-adapter-react";
import { buildVersionedBatchForMints, chunkMints, MAX_MINTS_PER_TX } from "@/lib/batch";
import { simulateVersionedTransaction } from "@/lib/simulate-transaction";
import type { BatchSendProgress } from "@/types";

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export interface BatchSendParams {
  mints: string[];
  recipient: string;
  wallet: WalletContextState;
  senderAddress: string;
  onProgress?: (p: BatchSendProgress) => void;
}

export function useBatchSend() {
  const { connection } = useConnection();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ mints, recipient, wallet, senderAddress, onProgress }: BatchSendParams) => {
      const { publicKey, signAllTransactions, sendTransaction } = wallet;
      if (!publicKey) throw new Error("Wallet not connected");
      if (!sendTransaction && !signAllTransactions) {
        throw new Error("Wallet cannot sign or send transactions");
      }

      const recipientPk = new PublicKey(recipient);
      const mintPks = mints.map((m) => new PublicKey(m));
      const batches = chunkMints(mintPks, MAX_MINTS_PER_TX);

      const progress: BatchSendProgress = { sent: 0, total: mints.length, errors: [] };
      onProgress?.(progress);

      const builtBatches = await Promise.all(
        batches.map((batch) =>
          buildVersionedBatchForMints({
            connection,
            mints: batch,
            sender: publicKey,
            recipient: recipientPk,
            feePayer: publicKey,
          })
        )
      );

      const versionedTxs = builtBatches.map((b) => b.transaction);

      const signedTxs =
        signAllTransactions && versionedTxs.length > 0
          ? await signAllTransactions(versionedTxs)
          : null;

      const signatures: string[] = [];

      for (let i = 0; i < versionedTxs.length; i++) {
        const batch = batches[i] ?? [];
        const vtx = versionedTxs[i];
        const built = builtBatches[i];
        if (!vtx || !built) continue;
        const txToSim = signedTxs?.[i] ?? vtx;
        try {
          await simulateVersionedTransaction(connection, txToSim);
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          batch.forEach((pk) => {
            progress.errors.push({ mint: pk.toBase58(), message: msg });
          });
          onProgress?.({ ...progress, errors: [...progress.errors] });
          if (i < versionedTxs.length - 1) await delay(400);
          continue;
        }
        try {
          let sig: string;
          if (signedTxs?.[i]) {
            sig = await connection.sendRawTransaction(signedTxs[i].serialize(), {
              skipPreflight: false,
              preflightCommitment: "confirmed",
              maxRetries: 3,
            });
          } else {
            if (!sendTransaction) throw new Error("Wallet cannot send transactions");
            sig = await sendTransaction(versionedTxs[i], connection, {
              skipPreflight: false,
              preflightCommitment: "confirmed",
              maxRetries: 3,
            });
          }

          await connection.confirmTransaction(
            {
              signature: sig,
              blockhash: built.blockhash,
              lastValidBlockHeight: built.lastValidBlockHeight,
            },
            "confirmed"
          );
          signatures.push(sig);
          progress.sent += batch.length;
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          batch.forEach((pk) => {
            progress.errors.push({ mint: pk.toBase58(), message: msg });
          });
        }
        onProgress?.({ ...progress, errors: [...progress.errors] });
        if (i < versionedTxs.length - 1) await delay(400);
      }

      void queryClient.invalidateQueries({ queryKey: ["nfts", senderAddress] });
      return { signatures, progress };
    },
  });
}
