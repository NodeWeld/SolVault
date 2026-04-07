import { createHmac, randomBytes, timingSafeEqual } from "crypto";

const COOKIE = "solvault_siws";
const NONCE_COOKIE = "solvault_siws_nonce";

function secret(): string {
  const s = process.env.SESSION_SECRET?.trim();
  if (s && s.length >= 16) return s;
  if (process.env.NODE_ENV === "production") {
    console.warn("[siws] SESSION_SECRET missing or too short; SIWS verify disabled until set.");
  }
  return "dev-only-siws-secret-change-me";
}

function hmac(data: string): string {
  return createHmac("sha256", secret()).update(data).digest("hex");
}

export function sealSessionPayload(publicKey: string, expMs: number): string {
  const body = JSON.stringify({ pk: publicKey, exp: expMs });
  const sig = hmac(body);
  return Buffer.from(`${body}::${sig}`, "utf8").toString("base64url");
}

export function parseSessionCookie(value: string | undefined): { publicKey: string; exp: number } | null {
  if (!value) return null;
  try {
    const raw = Buffer.from(value, "base64url").toString("utf8");
    const sep = raw.lastIndexOf("::");
    if (sep < 0) return null;
    const body = raw.slice(0, sep);
    const sig = raw.slice(sep + 2);
    const expected = hmac(body);
    const a = Buffer.from(sig, "utf8");
    const b = Buffer.from(expected, "utf8");
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return null;
    }
    const parsed = JSON.parse(body) as { pk?: string; exp?: number };
    if (typeof parsed.pk !== "string" || typeof parsed.exp !== "number") return null;
    if (Date.now() > parsed.exp) return null;
    return { publicKey: parsed.pk, exp: parsed.exp };
  } catch {
    return null;
  }
}

export function mintNonceCookie(): { name: string; value: string; maxAge: number; nonce: string } {
  const n = randomBytes(24).toString("base64url");
  const exp = Date.now() + 5 * 60 * 1000;
  const body = JSON.stringify({ n, exp });
  const sig = hmac(body);
  const value = Buffer.from(`${body}::${sig}`, "utf8").toString("base64url");
  return { name: NONCE_COOKIE, value, maxAge: 300, nonce: n };
}

export function parseNonceCookie(value: string | undefined): { nonce: string } | null {
  if (!value) return null;
  try {
    const raw = Buffer.from(value, "base64url").toString("utf8");
    const sep = raw.lastIndexOf("::");
    if (sep < 0) return null;
    const body = raw.slice(0, sep);
    const sig = raw.slice(sep + 2);
    const expected = hmac(body);
    const a = Buffer.from(sig, "utf8");
    const b = Buffer.from(expected, "utf8");
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return null;
    }
    const parsed = JSON.parse(body) as { n?: string; exp?: number };
    if (typeof parsed.n !== "string" || typeof parsed.exp !== "number") return null;
    if (Date.now() > parsed.exp) return null;
    return { nonce: parsed.n };
  } catch {
    return null;
  }
}

export const siwsCookieName = COOKIE;
export const siwsNonceCookieName = NONCE_COOKIE;

export function sealSessionCookie(publicKey: string): { name: string; value: string; maxAge: number } {
  const exp = Date.now() + 7 * 24 * 60 * 60 * 1000;
  return {
    name: COOKIE,
    value: sealSessionPayload(publicKey, exp),
    maxAge: 7 * 24 * 60 * 60,
  };
}
