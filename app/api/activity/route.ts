import {
  ConfirmedSignatureInfo,
  ParsedTransactionWithMeta,
  PublicKey,
} from "@solana/web3.js";
import { NextResponse } from "next/server";
import type { ActivityItem } from "@/types";
import { createConnection } from "@/lib/solana";

export const dynamic = "force-dynamic";

interface TokenBalRow {
  accountIndex: number;
  mint: string;
  decimals: number;
  rawAmount: bigint;
  owner: string | null;
}

type RpcTokenBal = NonNullable<
  NonNullable<ParsedTransactionWithMeta["meta"]>["preTokenBalances"]
>[number];

function rawAmountFromRpc(b: RpcTokenBal): bigint {
  const dec = b.uiTokenAmount?.decimals ?? 0;
  const amtStr = b.uiTokenAmount?.amount;
  if (amtStr != null && amtStr !== "") {
    try {
      return BigInt(amtStr);
    } catch {
      /* fall through */
    }
  }
  const ui = b.uiTokenAmount?.uiAmount;
  if (typeof ui === "number" && Number.isFinite(ui)) {
    return BigInt(Math.round(ui * 10 ** dec));
  }
  return BigInt(0);
}

function rowFromBalance(b: RpcTokenBal): TokenBalRow {
  const decimals = b.uiTokenAmount?.decimals ?? 0;
  return {
    accountIndex: b.accountIndex,
    mint: b.mint,
    decimals,
    rawAmount: rawAmountFromRpc(b),
    owner: b.owner ?? null,
  };
}

function collectRows(
  tx: ParsedTransactionWithMeta,
  kind: "pre" | "post"
): Map<string, TokenBalRow> {
  const meta = tx.meta;
  const out = new Map<string, TokenBalRow>();
  if (!meta) return out;
  const list = kind === "pre" ? meta.preTokenBalances : meta.postTokenBalances;
  if (!list) return out;
  for (const b of list) {
    const row = rowFromBalance(b);
    const key = `${row.accountIndex}:${row.mint}`;
    out.set(key, row);
  }
  return out;
}

function inferNftDelta(
  pre: TokenBalRow | undefined,
  post: TokenBalRow | undefined,
  wallet: string
): { mint: string; direction: "in" | "out" } | null {
  const mint = post?.mint ?? pre?.mint;
  if (!mint) return null;
  const preO = pre?.owner ?? null;
  const postO = post?.owner ?? null;
  const dec = post?.decimals ?? pre?.decimals ?? 0;
  if (dec !== 0) return null;

  const preAmt = pre?.rawAmount ?? BigInt(0);
  const postAmt = post?.rawAmount ?? BigInt(0);
  const had = preAmt >= BigInt(1);
  const has = postAmt >= BigInt(1);

  if (!had && has && postO === wallet) return { mint, direction: "in" };
  if (had && !has && preO === wallet) return { mint, direction: "out" };
  if (preO === wallet && postO && postO !== wallet && has) return { mint, direction: "out" };
  if (preO && preO !== wallet && postO === wallet && has) return { mint, direction: "in" };
  return null;
}

function buildActivityItem(
  sig: string,
  tx: ParsedTransactionWithMeta | null,
  wallet: string
): ActivityItem {
  if (!tx?.meta) {
    return {
      signature: sig,
      slot: tx?.slot ?? 0,
      blockTime: tx?.blockTime ?? null,
      direction: "unknown",
      mint: null,
      nftName: null,
      collection: null,
    };
  }

  const preMap = collectRows(tx, "pre");
  const postMap = collectRows(tx, "post");
  const keys = new Set<string>([
    ...Array.from(preMap.keys()),
    ...Array.from(postMap.keys()),
  ]);
  let best: { mint: string; direction: "in" | "out" } | null = null;

  for (const key of Array.from(keys)) {
    const pre = preMap.get(key);
    const post = postMap.get(key);
    const hit = inferNftDelta(pre, post, wallet);
    if (hit) {
      best = hit;
      break;
    }
  }

  return {
    signature: sig,
    slot: tx.slot,
    blockTime: tx.blockTime ?? null,
    direction: best?.direction ?? "unknown",
    mint: best?.mint ?? null,
    nftName: null,
    collection: null,
  };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const address = searchParams.get("address")?.trim();
  if (!address || address.length < 32) {
    return NextResponse.json({ error: "Invalid address" }, { status: 400 });
  }

  try {
    const pk = new PublicKey(address);
    const connection = createConnection("confirmed");
    const sigs: ConfirmedSignatureInfo[] = await connection.getSignaturesForAddress(pk, {
      limit: 20,
    });

    const activity: ActivityItem[] = [];
    for (const s of sigs) {
      const tx = await connection.getParsedTransaction(s.signature, {
        maxSupportedTransactionVersion: 0,
        commitment: "confirmed",
      });
      activity.push(buildActivityItem(s.signature, tx, address));
    }

    return NextResponse.json({ activity });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Activity error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
