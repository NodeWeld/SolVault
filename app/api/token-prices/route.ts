import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const JUPITER_PRICE = "https://api.jup.ag/price/v3";

/** Mint → USD price (when Jupiter can quote it). */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const idsParam = searchParams.get("mints")?.trim();
    if (!idsParam) {
      return NextResponse.json({ prices: {} as Record<string, number | null> });
    }
    const ids = [...new Set(idsParam.split(",").map((s) => s.trim()).filter(Boolean))].slice(0, 50);
    if (!ids.length) {
      return NextResponse.json({ prices: {} as Record<string, number | null> });
    }

    const apiKey = process.env.JUPITER_API_KEY?.trim();
    const url = `${JUPITER_PRICE}?ids=${encodeURIComponent(ids.join(","))}`;
    const headers: HeadersInit = {};
    if (apiKey) headers["x-api-key"] = apiKey;

    const res = await fetch(url, { headers, next: { revalidate: 60 } });
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      return NextResponse.json(
        { error: `Price service error (${res.status})`, detail: t.slice(0, 200) },
        { status: 502 }
      );
    }

    const raw = (await res.json()) as Record<
      string,
      { usdPrice?: number } | undefined
    >;
    const prices: Record<string, number | null> = {};
    for (const id of ids) {
      const row = raw[id];
      const p = row?.usdPrice;
      prices[id] = typeof p === "number" && Number.isFinite(p) ? p : null;
    }
    return NextResponse.json({ prices });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to fetch prices";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
