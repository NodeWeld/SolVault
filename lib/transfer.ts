import {
  PublicKey,
  Transaction,
  TransactionInstruction,
  type Connection,
} from "@solana/web3.js";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
import type { BuiltLegacyTransaction } from "@/lib/sol-transfer";
import { getTokenProgramForMint } from "@/lib/token-mint-program";

export async function buildNftTransferInstructions(params: {
  connection: Connection;
  mint: PublicKey;
  sender: PublicKey;
  recipient: PublicKey;
}): Promise<TransactionInstruction[]> {
  const { connection, mint, sender, recipient } = params;

  const programId = await getTokenProgramForMint(connection, mint);

  const senderAta = await getAssociatedTokenAddress(
    mint,
    sender,
    false,
    programId,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );
  const recipientAta = await getAssociatedTokenAddress(
    mint,
    recipient,
    false,
    programId,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );

  const ix: TransactionInstruction[] = [];
  const recipientInfo = await connection.getAccountInfo(recipientAta);
  if (!recipientInfo) {
    ix.push(
      createAssociatedTokenAccountInstruction(
        sender,
        recipientAta,
        recipient,
        mint,
        programId,
        ASSOCIATED_TOKEN_PROGRAM_ID
      )
    );
  }

  ix.push(
    createTransferInstruction(
      senderAta,
      recipientAta,
      sender,
      1,
      [],
      programId
    )
  );

  return ix;
}

export async function buildNftTransferTransaction(params: {
  connection: Connection;
  mint: PublicKey;
  sender: PublicKey;
  recipient: PublicKey;
  feePayer: PublicKey;
}): Promise<BuiltLegacyTransaction> {
  const { connection, feePayer } = params;
  const instructions = await buildNftTransferInstructions(params);
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
  const tx = new Transaction();
  tx.feePayer = feePayer;
  tx.recentBlockhash = blockhash;
  tx.add(...instructions);
  return { transaction: tx, blockhash, lastValidBlockHeight };
}
