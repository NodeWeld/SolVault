import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { mintNonceCookie } from "@/lib/siws-session";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const host = searchParams.get("host")?.trim() || new URL(req.url).host || "SolVault";
  const minted = mintNonceCookie();
  const jar = cookies();
  jar.set(minted.name, minted.value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: minted.maxAge,
  });
  return NextResponse.json({
    nonce: minted.nonce,
    domain: host.split(":")[0],
  });
}
