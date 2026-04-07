import type { Connection, PublicKey } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";

export async function getTokenProgramForMint(
  connection: Connection,
  mint: PublicKey
): Promise<PublicKey> {
  const info = await connection.getAccountInfo(mint, "confirmed");
  if (!info) throw new Error("Mint account not found");
  if (info.owner.equals(TOKEN_PROGRAM_ID)) return TOKEN_PROGRAM_ID;
  if (info.owner.equals(TOKEN_2022_PROGRAM_ID)) return TOKEN_2022_PROGRAM_ID;
  throw new Error("This mint uses an unsupported token program (expected SPL Token or Token-2022)");
}
