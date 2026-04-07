import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { formatSiwsMessage } from "@/lib/siws-message";
import { parseNonceCookie, sealSessionCookie, siwsNonceCookieName } from "@/lib/siws-session";
import { verifySiwsEd25519 } from "@/lib/verify-siws-signature";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const jar = cookies();
    const nonceRaw = jar.get(siwsNonceCookieName)?.value;
    const nonceParsed = parseNonceCookie(nonceRaw);
    if (!nonceParsed) {
      return NextResponse.json({ error: "Missing or expired nonce; request a new one." }, { status: 400 });
    }

    const body = (await req.json()) as {
      publicKey?: string;
      message?: string;
      signature?: string;
      domain?: string;
      issuedAt?: string;
    };
    const publicKey = body.publicKey?.trim();
    const message = body.message?.trim();
    const signature = body.signature?.trim();
    const issuedAt = body.issuedAt?.trim();
    if (!publicKey || !message || !signature || !issuedAt) {
      return NextResponse.json(
        { error: "publicKey, message, signature, and issuedAt are required" },
        { status: 400 }
      );
    }

    const issuedMs = Date.parse(issuedAt);
    if (!Number.isFinite(issuedMs) || Math.abs(Date.now() - issuedMs) > 10 * 60 * 1000) {
      return NextResponse.json({ error: "issuedAt is invalid or too old" }, { status: 400 });
    }

    const url = new URL(req.url);
    const domain = body.domain?.trim() || url.host || "localhost";

    const expected = formatSiwsMessage({
      domain,
      address: publicKey,
      nonce: nonceParsed.nonce,
      issuedAt,
    });
    if (message !== expected) {
      return NextResponse.json({ error: "Message does not match expected SIWS payload." }, { status: 400 });
    }

    if (!verifySiwsEd25519({ publicKeyBase58: publicKey, messageUtf8: message, signatureBase58: signature })) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const session = sealSessionCookie(publicKey);
    jar.set(session.name, session.value, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: session.maxAge,
    });
    jar.delete(siwsNonceCookieName);

    return NextResponse.json({ ok: true, publicKey, expiresInSec: session.maxAge });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Verify failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
