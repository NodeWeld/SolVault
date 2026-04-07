"use client";

import { useCallback, useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import bs58 from "bs58";
import { Button } from "@/components/ui/button";
import { formatSiwsMessage } from "@/lib/siws-message";
import { Loader2, ShieldCheck, ShieldAlert } from "lucide-react";

async function readSession(): Promise<{ verified: boolean; publicKey?: string }> {
  const res = await fetch("/api/auth/siws/session", { credentials: "include" });
  if (!res.ok) return { verified: false };
  const data = (await res.json()) as { verified?: boolean; publicKey?: string };
  return { verified: Boolean(data.verified), publicKey: data.publicKey };
}

export function SiwsSessionBar() {
  const { publicKey, signMessage, connected } = useWallet();
  const [sessionPk, setSessionPk] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const s = await readSession();
      setSessionPk(s.verified && s.publicKey ? s.publicKey : null);
    } finally {
      setLoading(false);
    }
  }, []);

  const walletPkStr = publicKey?.toBase58() ?? "";

  useEffect(() => {
    void refresh();
  }, [refresh, connected, walletPkStr]);

  const walletPk = publicKey?.toBase58() ?? null;
  const sessionOk = Boolean(walletPk && sessionPk && sessionPk === walletPk);

  async function verify() {
    if (!publicKey || !signMessage) {
      setErr("Wallet cannot sign messages");
      return;
    }
    setErr(null);
    setBusy(true);
    try {
      const host = typeof window !== "undefined" ? window.location.host : "localhost";
      const nonceRes = await fetch(`/api/auth/siws/nonce?host=${encodeURIComponent(host)}`, {
        credentials: "include",
      });
      if (!nonceRes.ok) {
        throw new Error("Could not start verify flow");
      }
      const { nonce, domain } = (await nonceRes.json()) as { nonce: string; domain: string };
      const issuedAt = new Date().toISOString();
      const message = formatSiwsMessage({
        domain,
        address: publicKey.toBase58(),
        nonce,
        issuedAt,
      });
      const sigBytes = await signMessage(new TextEncoder().encode(message));
      const verifyRes = await fetch("/api/auth/siws/verify", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          publicKey: publicKey.toBase58(),
          message,
          signature: bs58.encode(sigBytes),
          domain,
          issuedAt,
        }),
      });
      if (!verifyRes.ok) {
        const j = await verifyRes.json().catch(() => ({}));
        throw new Error((j as { error?: string }).error ?? "Verification failed");
      }
      await refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  if (!connected || !walletPk) return null;

  return (
    <div
      className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] bg-[#070a10]/95 px-4 py-2 text-xs text-muted-foreground sm:px-6"
      role="status"
    >
      <div className="flex items-center gap-2">
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin opacity-70" aria-hidden />
        ) : sessionOk ? (
          <ShieldCheck className="h-3.5 w-3.5 text-solana-green" aria-hidden />
        ) : (
          <ShieldAlert className="h-3.5 w-3.5 text-amber-400/90" aria-hidden />
        )}
        <span>
          {sessionOk
            ? "Session verified (signed message). Optional proof for future account features."
            : "Wallet connected — verify with a one-time signature to establish an optional server session."}
        </span>
      </div>
      {!sessionOk ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-7 border-border-subtle text-xs"
          disabled={busy || !signMessage}
          onClick={() => void verify()}
        >
          {busy ? (
            <>
              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              Sign…
            </>
          ) : (
            "Verify session"
          )}
        </Button>
      ) : null}
      {err ? <p className="w-full text-red-400">{err}</p> : null}
    </div>
  );
}
