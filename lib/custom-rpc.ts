import { clusterApiUrl } from "@solana/web3.js";
import { getRpcUrl } from "@/lib/solana";

export const CUSTOM_RPC_STORAGE_KEY = "solvault.customRpcUrl";

/** Fires on same-tab updates from Settings (ConnectionProvider listens). */
export const CUSTOM_RPC_CHANGED_EVENT = "solvault-rpc-changed";

export function validateCustomRpcUrl(raw: string): { ok: true; url: string } | { ok: false; error: string } {
  const t = raw.trim();
  if (!t) return { ok: false, error: "URL is empty" };
  try {
    const u = new URL(t);
    if (u.protocol !== "https:" && u.protocol !== "http:") {
      return { ok: false, error: "Use http: or https:" };
    }
    if (u.protocol === "http:" && u.hostname !== "localhost" && u.hostname !== "127.0.0.1") {
      return { ok: false, error: "http: is only allowed for localhost / 127.0.0.1" };
    }
    return { ok: true, url: t };
  } catch {
    return { ok: false, error: "Not a valid URL" };
  }
}

export function readCustomRpcFromStorage(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const v = localStorage.getItem(CUSTOM_RPC_STORAGE_KEY)?.trim();
    if (!v) return null;
    const r = validateCustomRpcUrl(v);
    return r.ok ? r.url : null;
  } catch {
    return null;
  }
}

export function writeCustomRpcToStorage(url: string | null): void {
  if (typeof window === "undefined") return;
  if (url == null || url.trim() === "") {
    localStorage.removeItem(CUSTOM_RPC_STORAGE_KEY);
    return;
  }
  const r = validateCustomRpcUrl(url);
  if (!r.ok) throw new Error(r.error);
  localStorage.setItem(CUSTOM_RPC_STORAGE_KEY, r.url);
}

export function notifyCustomRpcChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(CUSTOM_RPC_CHANGED_EVENT));
}

/** Wallet `Connection` endpoint: browser override or env default (for Providers). */
export function resolveWalletRpcEndpoint(): string {
  const custom = readCustomRpcFromStorage();
  if (custom) return custom;
  try {
    return getRpcUrl();
  } catch {
    return clusterApiUrl("mainnet-beta");
  }
}

export function getRpcEndpointInfo(): { source: "custom" | "default"; url: string } {
  const custom = readCustomRpcFromStorage();
  if (custom) return { source: "custom", url: custom };
  try {
    return { source: "default", url: getRpcUrl() };
  } catch {
    return { source: "default", url: clusterApiUrl("mainnet-beta") };
  }
}
