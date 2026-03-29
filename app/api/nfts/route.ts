import { NextResponse } from "next/server";
import { fetchAssetsByOwnerPage, HELIUS_NFT_PAGE_SIZE } from "@/lib/helius";
import { getHeliusDasRpcUrl } from "@/lib/solana";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { address?: string; page?: number };
    const address = body.address?.trim();
    if (!address || address.length < 32) {
      return NextResponse.json({ error: "Invalid wallet address" }, { status: 400 });
    }

    const pageRaw = body.page;
    const page =
      typeof pageRaw === "number" && Number.isFinite(pageRaw)
        ? Math.max(1, Math.floor(pageRaw))
        : 1;

    const rpcUrl = getHeliusDasRpcUrl();
    const result = await fetchAssetsByOwnerPage(address, rpcUrl, page, HELIUS_NFT_PAGE_SIZE);
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to fetch NFTs";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
