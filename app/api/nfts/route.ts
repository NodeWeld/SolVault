import { NextResponse } from "next/server";
import { fetchAssetsByOwner } from "@/lib/helius";
import { getHeliusDasRpcUrl } from "@/lib/solana";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { address?: string };
    const address = body.address?.trim();
    if (!address || address.length < 32) {
      return NextResponse.json({ error: "Invalid wallet address" }, { status: 400 });
    }

    const rpcUrl = getHeliusDasRpcUrl();
    const nfts = await fetchAssetsByOwner(address, rpcUrl);
    return NextResponse.json({ nfts });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to fetch NFTs";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
