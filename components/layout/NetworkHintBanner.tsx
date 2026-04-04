"use client";

import { useCallback, useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { clusterHintSentence, getConfiguredCluster } from "@/lib/app-network";

const STORAGE_KEY = "solvault-network-hint-dismissed";

export function NetworkHintBanner() {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try {
      setDismissed(sessionStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      setDismissed(false);
    }
  }, []);

  const dismiss = useCallback(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
    setDismissed(true);
  }, []);

  if (dismissed) return null;

  const cluster = getConfiguredCluster();

  return (
    <div
      role="status"
      className="border-b border-amber-500/30 bg-amber-950/40 px-4 py-2 text-center text-xs text-amber-100/95 sm:px-6"
    >
      <div className="mx-auto flex max-w-7xl items-start justify-center gap-2 sm:items-center">
        <p className="flex-1 text-left sm:text-center">{clusterHintSentence(cluster)}</p>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0 text-amber-200/80 hover:bg-amber-900/40 hover:text-amber-50"
          onClick={dismiss}
          aria-label="Dismiss network notice"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
