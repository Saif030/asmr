"use client";

import * as React from "react";
import Link from "next/link";
import { Bookmark, FileText, ImageIcon, Link2, Youtube } from "lucide-react";

import { SaveButton } from "@/components/library/save-button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppwrite } from "@/lib/appwrite/client";
import { listMaterials, listSavedMaterials } from "@/lib/appwrite/data";
import type { DataClient } from "@/lib/appwrite/data";
import { MATERIAL_TYPE_LABELS } from "@/lib/constants/limits";
import { formatDate } from "@/lib/utils";
import type { MaterialWithRelations } from "@/types/appwrite";

export function SavedView({ userId }: { userId: string }) {
  const { tablesDB, ready } = useAppwrite();
  const [items, setItems] = React.useState<MaterialWithRelations[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!ready) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const client = { tablesDB } as unknown as DataClient;
        const saved = await listSavedMaterials(client, userId);
        if (!saved.length) {
          if (!cancelled) {
            setItems([]);
            setLoading(false);
          }
          return;
        }

        const materials = await listMaterials(client, { limit: 100 });
        if (!cancelled) {
          const wanted = new Set(saved.map((row) => row.materialId));
          setItems(materials.filter((material) => wanted.has(material.$id)));
          setLoading(false);
        }
      } catch {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [ready, tablesDB, userId]);

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  if (!items.length) {
    return (
      <EmptyState
        icon={<Bookmark className="h-5 w-5" />}
        title="Nothing saved yet"
        description="Tap the bookmark on any library item and it will show up here for later."
        action={
          <Link
            href="/library"
            className="inline-flex h-10 items-center rounded-xl bg-accent px-4 text-sm font-medium text-accent-foreground shadow-subtle transition-colors hover:bg-accent-hover"
          >
            Browse the library
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-3">
      {items.map((material) => (
        <div
          key={material.$id}
          className="flex items-center gap-4 rounded-2xl border border-border bg-background p-4 shadow-subtle"
        >
          <Link
            href={`/library/${material.$id}`}
            className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-surface text-foreground-muted"
          >
            {material.kind === "youtube" ? (
              <Youtube className="h-5 w-5" />
            ) : material.kind === "link" ? (
              <Link2 className="h-5 w-5" />
            ) : material.type === "image" ? (
              <ImageIcon className="h-5 w-5" />
            ) : (
              <FileText className="h-5 w-5" />
            )}
          </Link>

          <div className="min-w-0 flex-1">
            <Link href={`/library/${material.$id}`}>
              <h3 className="truncate text-sm font-semibold text-foreground hover:text-accent">
                {material.title}
              </h3>
            </Link>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <Badge variant="outline">{MATERIAL_TYPE_LABELS[material.type] ?? material.type}</Badge>
              {material.subject && <Badge variant="solid">{material.subject.name}</Badge>}
              <span className="text-xs text-foreground-subtle">
                by {material.uploader?.name ?? "Unknown"} · {formatDate(material.createdAt)}
              </span>
            </div>
          </div>

          <SaveButton materialId={material.$id} initialSaved variant="outline" size="sm" />
        </div>
      ))}
    </div>
  );
}
