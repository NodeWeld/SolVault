import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function getCoinGeckoBase(): string {
  return (
    process.env.NEXT_PUBLIC_COINGECKO_API?.replace(/\/$/, "") ??
    "https://api.coingecko.com/api/v3"
  );
}

export async function GET() {
  try {
    const base = getCoinGeckoBase();
    const url = `${base}/simple/price?ids=solana&vs_currencies=usd&include_24hr_change=true`;
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: 60 },
    });
    if (!res.ok) {
      return NextResponse.json({ error: "CoinGecko request failed" }, { status: 502 });
    }
    const data = (await res.json()) as {
      solana?: { usd?: number; usd_24h_change?: number };
    };
    const sol = data.solana;
    const usd = sol?.usd ?? 0;
    const change24h =
      typeof sol?.usd_24h_change === "number" ? sol.usd_24h_change : null;
    return NextResponse.json({ usd, change24h });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Price error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
