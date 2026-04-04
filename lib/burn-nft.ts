import {
  PublicKey,
  Transaction,
  type Connection,
  type ParsedAccountData,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  createBurnCheckedInstruction,
  createCloseAccountInstruction,
} from "@solana/spl-token";

interface HolderAccount {
  ata: PublicKey;
  programId: PublicKey;
  amount: bigint;
  decimals: number;
  frozen: boolean;
}

function parseHolderFromParsedAccount(
  ata: PublicKey,
  account: { owner: PublicKey; data: ParsedAccountData },
  expectedMint: PublicKey
): HolderAccount | null {
  if (!account.owner.equals(TOKEN_PROGRAM_ID) && !account.owner.equals(TOKEN_2022_PROGRAM_ID)) {
    return null;
  }

  const data = account.data as ParsedAccountData;
  if (typeof data.parsed !== "object" || data.parsed === null) return null;

  const info = (data.parsed as { info?: Record<string, unknown> }).info as
    | {
        mint?: string;
        tokenAmount?: { amount: string; decimals: number };
        state?: string;
      }
    | undefined;

  if (!info?.mint || info.mint !== expectedMint.toBase58()) return null;

  const amountStr = info.tokenAmount?.amount;
  const decimals = info.tokenAmount?.decimals;
  if (amountStr == null || decimals == null) return null;

  const amount = BigInt(amountStr);
  if (amount <= 0n) return null;

  return {
    ata,
    programId: account.owner,
    amount,
    decimals,
    frozen: info.state === "frozen",
  };
}

export interface BuiltBurnNftTransaction {
  transaction: Transaction;
  blockhash: string;
  lastValidBlockHeight: number;
}

/**
 * Burn all tokens in the owner's SPL account for this mint, then close that account (rent reclaim).
 * Resolves Token vs Token-2022 and the actual token account address (not only canonical ATA).
 */
export async function buildBurnNftTransaction(params: {
  connection: Connection;
  mint: PublicKey;
  owner: PublicKey;
  feePayer: PublicKey;
}): Promise<BuiltBurnNftTransaction> {
  const { connection, mint, owner, feePayer } = params;

  const { value: tokenAccounts } = await connection.getParsedTokenAccountsByOwner(owner, {
    mint,
  });

  const holders: HolderAccount[] = [];
  for (const { pubkey, account } of tokenAccounts) {
    const h = parseHolderFromParsedAccount(pubkey, account, mint);
    if (h) holders.push(h);
  }

  if (holders.length === 0) {
    throw new Error(
      "No SPL token account with a balance was found for this mint. Compressed NFTs, Metaplex Core assets, or non–token-based items cannot be burned here."
    );
  }

  if (holders.length > 1) {
    throw new Error(
      "More than one token account holds this mint. Consolidate or close accounts manually, then try again."
    );
  }

  const holder = holders[0];

  if (holder.frozen) {
    throw new Error(
      "This token account is frozen (typical for programmable NFTs). Use a Metaplex-aware tool to thaw or burn, or revoke the freeze authority first."
    );
  }

  const ix = [
    createBurnCheckedInstruction(
      holder.ata,
      mint,
      owner,
      holder.amount,
      holder.decimals,
      [],
      holder.programId
    ),
    createCloseAccountInstruction(holder.ata, owner, owner, [], holder.programId),
  ];

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
  const transaction = new Transaction();
  transaction.feePayer = feePayer;
  transaction.recentBlockhash = blockhash;
  transaction.add(...ix);

  return { transaction, blockhash, lastValidBlockHeight };
}
