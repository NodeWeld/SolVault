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
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

export async function buildNftTransferInstructions(params: {
  connection: Connection;
  mint: PublicKey;
  sender: PublicKey;
  recipient: PublicKey;
}): Promise<TransactionInstruction[]> {
  const { connection, mint, sender, recipient } = params;

  const senderAta = await getAssociatedTokenAddress(
    mint,
    sender,
    false,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );
  const recipientAta = await getAssociatedTokenAddress(
    mint,
    recipient,
    false,
    TOKEN_PROGRAM_ID,
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
        TOKEN_PROGRAM_ID,
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
      TOKEN_PROGRAM_ID
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
}): Promise<Transaction> {
  const { connection, feePayer } = params;
  const instructions = await buildNftTransferInstructions(params);
  const { blockhash } = await connection.getLatestBlockhash("confirmed");
  const tx = new Transaction();
  tx.feePayer = feePayer;
  tx.recentBlockhash = blockhash;
  tx.add(...instructions);
  return tx;
}
