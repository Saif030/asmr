"use client";

import * as React from "react";
import { Loader2, Search } from "lucide-react";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppwrite } from "@/lib/appwrite/client";
import { listMaterials } from "@/lib/appwrite/data";
import type { DataClient } from "@/lib/appwrite/data";
import type { Material } from "@/types/appwrite";

/** Lets a member attach any library item to a chat message. */
export function MaterialPicker({
  open,
  onOpenChange,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (material: Material) => void;
}) {
  const { tablesDB, ready } = useAppwrite();
  const [items, setItems] = React.useState<Material[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [search, setSearch] = React.useState("");

  React.useEffect(() => {
    if (!open || !ready) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const rows = await listMaterials({ tablesDB } as unknown as DataClient, { sort: "newest", limit: 50 });
        if (!cancelled) setItems(rows as unknown as Material[]);
      } catch {
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [open, ready, tablesDB]);

  const filtered = items.filter((item) =>
    item.title.toLowerCase().includes(search.trim().toLowerCase()),
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Attach from the library</DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-subtle" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search the library…"
            className="pl-9"
          />
        </div>

        <div className="max-h-72 space-y-1 overflow-y-auto">
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-12 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-6 text-center text-sm text-foreground-muted">
              No matching library items.
            </p>
          ) : (
            filtered.map((item) => (
              <button
                key={item.$id}
                type="button"
                onClick={() => onSelect(item)}
                className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-surface"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-foreground">
                    {item.title}
                  </span>
                  <span className="block text-xs text-foreground-subtle">{item.type}</span>
                </span>
                {item.kind === "youtube" && (
                  <Loader2 className="h-3.5 w-3.5 shrink-0 text-foreground-subtle" />
                )}
              </button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
