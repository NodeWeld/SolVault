"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useActivity } from "@/hooks/useActivity";
import { solscanTxUrl } from "@/lib/solscan";
import type { ActivityItem } from "@/types";

const panel =
  "border border-blue-800/50 bg-blue-950/90 text-solana-green shadow-md shadow-blue-950/30 backdrop-blur-sm";

function timeAgo(blockTime: number | null): string {
  if (blockTime == null) return "Unknown time";
  const now = Math.floor(Date.now() / 1000);
  const diff = Math.max(0, now - blockTime);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function directionBadge(dir: ActivityItem["direction"]) {
  if (dir === "in") return <Badge variant="success">In</Badge>;
  if (dir === "out") return <Badge variant="destructive">Out</Badge>;
  return (
    <Badge variant="outline" className="border-blue-600/50 text-solana-green">
      Tx
    </Badge>
  );
}

interface ActivityFeedProps {
  address: string | null;
}

export function ActivityFeed({ address }: ActivityFeedProps) {
  const { data = [], isLoading, error } = useActivity(address);

  return (
    <Card className={panel}>
      <CardHeader className="pb-2">
        <CardTitle className="font-display text-base text-solana-green">Recent activity</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading ? (
          <p className="text-sm text-solana-green/70">Loading signatures…</p>
        ) : error ? (
          <p className="text-sm text-red-400">Could not load activity.</p>
        ) : (
          <ScrollArea className="h-64 pr-3">
            <ul className="space-y-3">
              {data.map((a) => (
                <li
                  key={a.signature}
                  className="rounded-lg border border-blue-800/40 bg-blue-900/35 p-3 text-xs text-solana-green"
                >
                  <div className="flex items-center justify-between gap-2">
                    {directionBadge(a.direction)}
                    <span className="text-solana-green/65">{timeAgo(a.blockTime)}</span>
                  </div>
                  <p className="mt-2 font-mono text-[10px] text-solana-green/55">
                    {a.mint ? `${a.mint.slice(0, 6)}…${a.mint.slice(-4)}` : "Token account change"}
                  </p>
                  <a
                    href={solscanTxUrl(a.signature)}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-block font-medium text-solana-green underline decoration-solana-green/50 hover:decoration-solana-green"
                  >
                    Solscan
                  </a>
                </li>
              ))}
              {!data.length ? (
                <li className="text-sm text-solana-green/65">No recent transactions.</li>
              ) : null}
            </ul>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
