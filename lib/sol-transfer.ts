import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

export async function buildSolTransferTransaction(params: {
  connection: Connection;
  from: PublicKey;
  to: PublicKey;
  lamports: bigint;
}): Promise<Transaction> {
  const { connection, from, to, lamports } = params;
  if (lamports <= 0n) throw new Error("Amount must be positive");
  const { blockhash } = await connection.getLatestBlockhash("confirmed");
  const tx = new Transaction();
  tx.feePayer = from;
  tx.recentBlockhash = blockhash;
  tx.add(
    SystemProgram.transfer({
      fromPubkey: from,
      toPubkey: to,
      lamports,
    })
  );
  return tx;
}

export function parseSolToLamports(sol: string): bigint {
  const t = sol.trim();
  if (!t || !/^\d*\.?\d*$/.test(t)) throw new Error("Invalid SOL amount");
  const [whole, frac = ""] = t.split(".");
  const fracPadded = (frac + "000000000").slice(0, 9);
  const lamports = BigInt(whole || "0") * BigInt(LAMPORTS_PER_SOL) + BigInt(fracPadded || "0");
  return lamports;
}

export async function buildFungibleSplTransferTransaction(params: {
  connection: Connection;
  mint: PublicKey;
  sender: PublicKey;
  recipient: PublicKey;
  amountRaw: bigint;
  feePayer: PublicKey;
}): Promise<Transaction> {
  const { connection, mint, sender, recipient, amountRaw, feePayer } = params;
  if (amountRaw <= 0n) throw new Error("Amount must be positive");

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

  const ix = [];
  const recipientInfo = await connection.getAccountInfo(recipientAta);
  if (!recipientInfo) {
    ix.push(
      createAssociatedTokenAccountInstruction(
        feePayer,
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
      amountRaw,
      [],
      TOKEN_PROGRAM_ID
    )
  );

  const { blockhash } = await connection.getLatestBlockhash("confirmed");
  const tx = new Transaction();
  tx.feePayer = feePayer;
  tx.recentBlockhash = blockhash;
  tx.add(...ix);
  return tx;
}

export function parseTokenAmountToRaw(amountUi: string, decimals: number): bigint {
  const t = amountUi.trim();
  if (!t || !/^\d*\.?\d*$/.test(t)) throw new Error("Invalid token amount");
  const [whole, frac = ""] = t.split(".");
  if (decimals === 0) {
    if (frac.length > 0) throw new Error("This token has no fractional part");
    return BigInt(whole || "0");
  }
  const fracPadded = (frac + "0".repeat(decimals)).slice(0, decimals);
  const base = BigInt(10) ** BigInt(decimals);
  return BigInt(whole || "0") * base + BigInt(fracPadded || "0");
}
