import { NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";
import type { ParsedAccountData } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import { createConnection } from "@/lib/solana";
import type { SplTokenBalance } from "@/types";

export const dynamic = "force-dynamic";

function isLikelyNft(decimals: number, uiAmount: number | null): boolean {
  return decimals === 0 && uiAmount === 1;
}

function collectFungibleTokens(
  rows: { pubkey: PublicKey; account: { data: ParsedAccountData } }[],
  programKind: SplTokenBalance["program"]
): SplTokenBalance[] {
  const out: SplTokenBalance[] = [];
  for (const { pubkey, account } of rows) {
    const parsed = account.data as ParsedAccountData;
    if (parsed.program !== "spl-token") continue;
    const info = parsed.parsed.info as {
      mint: string;
      tokenAmount: {
        amount: string;
        decimals: number;
        uiAmount: number | null;
        uiAmountString: string;
      };
    };
    const { mint, tokenAmount } = info;
    const ui = tokenAmount.uiAmount;
    if (ui == null || ui === 0) continue;
    if (isLikelyNft(tokenAmount.decimals, ui)) continue;

    out.push({
      ata: pubkey.toBase58(),
      mint,
      amountRaw: tokenAmount.amount,
      decimals: tokenAmount.decimals,
      uiAmount: tokenAmount.uiAmountString,
      program: programKind,
    });
  }
  return out;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const address = searchParams.get("address")?.trim();
    if (!address || address.length < 32) {
      return NextResponse.json({ error: "Invalid wallet address" }, { status: 400 });
    }

    const owner = new PublicKey(address);
    const connection = createConnection("confirmed");

    const [classic, token2022] = await Promise.all([
      connection.getParsedTokenAccountsByOwner(owner, { programId: TOKEN_PROGRAM_ID }),
      connection.getParsedTokenAccountsByOwner(owner, { programId: TOKEN_2022_PROGRAM_ID }),
    ]);

    const byAta = new Map<string, SplTokenBalance>();
    for (const t of collectFungibleTokens(classic.value, "token")) {
      byAta.set(t.ata, t);
    }
    for (const t of collectFungibleTokens(token2022.value, "token-2022")) {
      byAta.set(t.ata, t);
    }

    const tokens = [...byAta.values()].sort((a, b) => a.mint.localeCompare(b.mint));
    return NextResponse.json({ tokens } satisfies { tokens: SplTokenBalance[] });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to fetch tokens";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
