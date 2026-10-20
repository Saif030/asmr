"use client";

import * as React from "react";
import { Query } from "appwrite";
import { toast } from "sonner";
import {
  AlertTriangle,
  Database,
  HardDrive,
  HeartPulse,
  MessagesSquare,
  RefreshCw,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppwrite } from "@/lib/appwrite/client";
import { DATABASE_ID, TABLES } from "@/lib/appwrite/config";
import { STORAGE_QUOTA_BYTES, STORAGE_UPLOAD_BLOCK_BYTES } from "@/lib/constants/limits";
import { cn, formatBytes } from "@/lib/utils";
import type { DataClient } from "@/lib/appwrite/data";

type UsageResponse = {
  buckets: { bucketId: string; usedBytes: number; objectCount: number }[];
  totalBytes: number;
  limitBytes: number;
  blockBytes: number;
  blocked: boolean;
};

type Overview = {
  materials: number;
  messages: number;
  channels: number;
  members: number;
};

export function AdminView({ keepaliveUrl }: { keepaliveUrl: string }) {
  const { tablesDB, ready } = useAppwrite();
  const [usage, setUsage] = React.useState<UsageResponse | null>(null);
  const [overview, setOverview] = React.useState<Overview | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [origin, setOrigin] = React.useState("");

  React.useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const load = React.useCallback(async () => {
    if (!ready) return;

    const client = { tablesDB } as unknown as DataClient;
    const count = async (tableId: string) => {
      const { total } = await client.tablesDB.listRows({
        databaseId: DATABASE_ID,
        tableId,
        queries: [Query.limit(1)],
        total: true,
      });
      return total ?? 0;
    };

    const [usageResponse, materials, messages, channels, members] = await Promise.all([
      fetch("/api/storage/usage").catch(() => null),
      count(TABLES.materials),
      count(TABLES.messages),
      count(TABLES.channels),
      count(TABLES.profiles),
    ]);

    if (usageResponse?.ok) {
      setUsage((await usageResponse.json()) as UsageResponse);
    }

    setOverview({ materials, messages, channels, members });
    setLoading(false);
    setRefreshing(false);
  }, [ready, tablesDB]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const total = usage?.totalBytes ?? 0;
  const limit = usage?.limitBytes ?? STORAGE_QUOTA_BYTES;
  const percent = Math.min(100, Math.round((total / limit) * 100));
  const blocked = usage?.blocked ?? total >= STORAGE_UPLOAD_BLOCK_BYTES;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="h-4 w-4 text-foreground-muted" />
              Storage usage
            </CardTitle>
            <CardDescription>
              Appwrite&apos;s Education plan gives 150 GB. Uploads are blocked at 93% of
              the configured limit.
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            loading={refreshing}
            onClick={() => {
              setRefreshing(true);
              void load();
            }}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>
        </CardHeader>

        <CardContent className="space-y-4">
          {loading || !usage ? (
            <Skeleton className="h-24 w-full" />
          ) : (
            <>
              <div>
                <div className="flex items-end justify-between text-sm">
                  <span className="font-medium text-foreground">
                    {formatBytes(total)} used
                  </span>
                  <span className="text-foreground-subtle">
                    {formatBytes(limit)} limit · {percent}%
                  </span>
                </div>
                <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-surface-strong">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      blocked ? "bg-danger" : percent > 68 ? "bg-[#f59e0b]" : "bg-accent",
                    )}
                    style={{ width: `${Math.max(percent, total > 0 ? 2 : 0)}%` }}
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {usage.buckets.map((bucket) => {
                  const bucketPercent = Math.min(100, Math.round((bucket.usedBytes / limit) * 100));
                  return (
                    <div
                      key={bucket.bucketId}
                      className="rounded-xl border border-border bg-surface/60 p-3"
                    >
                      <p className="text-xs font-medium text-foreground">{bucket.bucketId}</p>
                      <p className="mt-0.5 text-xs text-foreground-subtle">
                        {bucket.objectCount} {bucket.objectCount === 1 ? "file" : "files"} ·{" "}
                        {formatBytes(bucket.usedBytes)}
                      </p>
                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-strong">
                        <div
                          className="h-full rounded-full bg-accent"
                          style={{
                            width: `${Math.max(bucketPercent, bucket.usedBytes > 0 ? 2 : 0)}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {blocked && (
                <div className="flex items-start gap-2.5 rounded-xl border border-[#fecaca] bg-danger-soft px-3 py-2.5">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
                  <p className="text-xs text-danger">
                    Uploads are currently blocked — storage is at or above the limit.
                    Delete a few files, or ask members to share big documents as external
                    links.
                  </p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Library items", value: overview?.materials, icon: Database },
          { label: "Messages", value: overview?.messages, icon: MessagesSquare },
          { label: "Channels", value: overview?.channels, icon: MessagesSquare },
          { label: "Members", value: overview?.members, icon: Users },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-foreground-subtle">
                <stat.icon className="h-4 w-4" />
                <span className="text-xs font-medium uppercase tracking-wide">
                  {stat.label}
                </span>
              </div>
              <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">
                {stat.value ?? "—"}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HeartPulse className="h-4 w-4 text-foreground-muted" />
            Keeping the project awake
          </CardTitle>
          <CardDescription>
            The Appwrite Education plan never pauses, but the free plan does after 7
            days of inactivity. The keepalive route and the GitHub Actions workflow touch
            the project every 3 days.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-xl border border-border bg-surface/60 px-3 py-2.5">
            <p className="text-xs text-foreground-subtle">Keepalive endpoint</p>
            <code className="mt-1 block break-all text-xs text-foreground">
              {keepaliveUrl || (origin ? `${origin}/api/keepalive` : "/api/keepalive")}
            </code>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              try {
                const response = await fetch("/api/keepalive");
                const payload = await response.json();
                if (response.ok) {
                  toast.success("Keepalive OK — the project is awake.");
                } else {
                  toast.error(payload.error ?? "Keepalive failed.");
                }
              } catch {
                toast.error("Could not reach the keepalive route.");
              }
            }}
          >
            Test keepalive
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
