import {
  PublicKey,
  Transaction,
  type Connection,
  type ParsedAccountData,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  createCloseAccountInstruction,
} from "@solana/spl-token";

/** Classic SPL token program only (not Token-2022). */
export async function listEmptyClassicSplAtas(
  connection: Connection,
  owner: PublicKey
): Promise<{ ata: string; mint: string }[]> {
  const res = await connection.getParsedTokenAccountsByOwner(owner, {
    programId: TOKEN_PROGRAM_ID,
  });
  const out: { ata: string; mint: string }[] = [];
  for (const { pubkey, account } of res.value) {
    const parsed = account.data as ParsedAccountData;
    if (parsed.program !== "spl-token") continue;
    const info = parsed.parsed.info as {
      mint: string;
      tokenAmount: { amount: string };
    };
    if (info.tokenAmount.amount !== "0") continue;
    out.push({ ata: pubkey.toBase58(), mint: info.mint });
  }
  out.sort((a, b) => a.mint.localeCompare(b.mint));
  return out;
}

export async function buildCloseSplAtasTransaction(params: {
  connection: Connection;
  owner: PublicKey;
  feePayer: PublicKey;
  atas: PublicKey[];
}): Promise<Transaction> {
  const { connection, owner, feePayer, atas } = params;
  if (!atas.length) throw new Error("No token accounts to close");

  const ix = atas.map((ata) =>
    createCloseAccountInstruction(ata, owner, owner, [], TOKEN_PROGRAM_ID)
  );

  const { blockhash } = await connection.getLatestBlockhash("confirmed");
  const tx = new Transaction();
  tx.feePayer = feePayer;
  tx.recentBlockhash = blockhash;
  tx.add(...ix);
  return tx;
}
