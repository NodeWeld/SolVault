import { NextResponse } from "next/server";
import { fetchCollectionFloor } from "@/lib/magiceden";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get("symbol")?.trim();
  if (!symbol) {
    return NextResponse.json({ error: "Missing symbol" }, { status: 400 });
  }
  try {
    const floor = await fetchCollectionFloor(symbol);
    return NextResponse.json({
      symbol,
      floorPrice: floor,
      currency: "SOL",
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Floor fetch failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
