import {
  Connection,
  PublicKey,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import { buildNftTransferInstructions } from "@/lib/transfer";

const MAX_MINTS_PER_TX = 5;

export function chunkMints<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

export interface BuiltVersionedBatch {
  transaction: VersionedTransaction;
  blockhash: string;
  lastValidBlockHeight: number;
}

export async function buildVersionedBatchForMints(params: {
  connection: Connection;
  mints: PublicKey[];
  sender: PublicKey;
  recipient: PublicKey;
  feePayer: PublicKey;
}): Promise<BuiltVersionedBatch> {
  const { connection, mints, sender, recipient, feePayer } = params;
  const limited = mints.slice(0, MAX_MINTS_PER_TX);
  const allIx = (
    await Promise.all(
      limited.map((mint) =>
        buildNftTransferInstructions({ connection, mint, sender, recipient })
      )
    )
  ).flat();

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
  const messageV0 = new TransactionMessage({
    payerKey: feePayer,
    recentBlockhash: blockhash,
    instructions: allIx,
  }).compileToV0Message();

  return {
    transaction: new VersionedTransaction(messageV0),
    blockhash,
    lastValidBlockHeight,
  };
}

export { MAX_MINTS_PER_TX };
