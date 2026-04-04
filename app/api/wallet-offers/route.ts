import { NextResponse } from "next/server";
import { fetchOffersReceivedMints } from "@/lib/magiceden-offers";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const address = searchParams.get("address")?.trim();
    if (!address || address.length < 32) {
      return NextResponse.json({ error: "Invalid wallet address" }, { status: 400 });
    }
    const mints = await fetchOffersReceivedMints(address);
    return NextResponse.json({ mints });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to fetch offers";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
