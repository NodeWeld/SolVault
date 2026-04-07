import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { parseSessionCookie, siwsCookieName } from "@/lib/siws-session";

export const dynamic = "force-dynamic";

export async function GET() {
  const jar = cookies();
  const raw = jar.get(siwsCookieName)?.value;
  const session = parseSessionCookie(raw);
  if (!session) {
    return NextResponse.json({ verified: false as const });
  }
  return NextResponse.json({
    verified: true as const,
    publicKey: session.publicKey,
    exp: session.exp,
  });
}
