"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { BookOpen, Filter, Plus, Search, X } from "lucide-react";

import { MaterialCard } from "@/components/library/material-card";
import { MaterialForm } from "@/components/library/material-form";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppwrite } from "@/lib/appwrite/client";
import { listMaterials, listSavedMaterials } from "@/lib/appwrite/data";
import type { DataClient } from "@/lib/appwrite/data";
import { DATABASE_ID, TABLES } from "@/lib/appwrite/config";
import { MATERIAL_TYPE_LABELS, MATERIAL_TYPE_ORDER } from "@/lib/constants/limits";
import { sanitizeSearchTerm } from "@/lib/file-validation";
import type { Material, MaterialWithRelations, Profile, Subject } from "@/types/appwrite";

type SortMode = "newest" | "oldest" | "title";

export function LibraryView({
  subjects,
  currentUser,
}: {
  subjects: Subject[];
  currentUser: Profile;
}) {
  const router = useRouter();
  const { tablesDB, ready } = useAppwrite();
  const [materials, setMaterials] = React.useState<MaterialWithRelations[]>([]);
  const [savedIds, setSavedIds] = React.useState<Set<string>>(new Set());
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [type, setType] = React.useState("all");
  const [subjectId, setSubjectId] = React.useState("all");
  const [year, setYear] = React.useState("all");
  const [sort, setSort] = React.useState<SortMode>("newest");
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Material | null>(null);

  // Debounce search so we do not hit Appwrite on every keystroke.
  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(timer);
  }, [search]);

  const load = React.useCallback(async () => {
    if (!ready) return;
    setLoading(true);

    try {
      const client = { tablesDB } as unknown as DataClient;
      const [rows, saved] = await Promise.all([
        listMaterials(client, {
          search: sanitizeSearchTerm(debouncedSearch),
          type,
          subjectId,
          year: year === "all" ? null : Number(year),
          sort,
        }),
        listSavedMaterials(client, currentUser.userId),
      ]);

      setMaterials(rows);
      setSavedIds(new Set(saved.map((row) => row.materialId)));
    } catch (error) {
      toast.error(
        `Could not load the library: ${String((error as Error)?.message ?? error)}`,
      );
    } finally {
      setLoading(false);
    }
  }, [ready, tablesDB, debouncedSearch, type, subjectId, year, sort, currentUser.userId]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const years = React.useMemo(() => {
    const set = new Set<number>();
    materials.forEach((material) => {
      if (material.year) set.add(material.year);
    });
    return Array.from(set).sort((a, b) => b - a);
  }, [materials]);

  async function toggleSave(material: MaterialWithRelations) {
    const next = !savedIds.has(material.$id);
    const previous = savedIds;
    const updated = new Set(savedIds);
    if (next) updated.add(material.$id);
    else updated.delete(material.$id);
    setSavedIds(updated);

    const response = await fetch("/api/saved", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ materialId: material.$id, action: next ? "save" : "unsave" }),
    }).catch(() => null);

    if (!response?.ok) {
      setSavedIds(previous);
      toast.error("Could not update your saved items.");
      return;
    }
    toast.success(next ? "Saved for later." : "Removed from saved.");
  }

  async function handleDelete(material: MaterialWithRelations) {
    try {
      // Appwrite enforces "only the uploader or an admin may delete".
      await tablesDB.deleteRow({
        databaseId: DATABASE_ID,
        tableId: TABLES.materials,
        rowId: material.$id,
      });
      toast.success("Item deleted.");
      void load();
    } catch (error) {
      toast.error(String((error as Error)?.message ?? "Could not delete that item."));
    }
  }

  const hasFilters =
    search !== "" || type !== "all" || subjectId !== "all" || year !== "all";

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-subtle" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search titles, tags, subjects…"
            className="pl-9"
            aria-label="Search the library"
          />
        </div>
        <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
          <Plus className="h-4 w-4" />
          Add item
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground-subtle">
          <Filter className="h-3.5 w-3.5" />
          Filters
        </span>

        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="h-9 w-auto min-w-[9.5rem] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {MATERIAL_TYPE_ORDER.map((value) => (
              <SelectItem key={value} value={value}>
                {MATERIAL_TYPE_LABELS[value]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={subjectId} onValueChange={setSubjectId}>
          <SelectTrigger className="h-9 w-auto min-w-[9.5rem] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All subjects</SelectItem>
            {subjects.map((subject) => (
              <SelectItem key={subject.$id} value={subject.$id}>
                {subject.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={year} onValueChange={setYear}>
          <SelectTrigger className="h-9 w-auto min-w-[7rem] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any year</SelectItem>
            {years.map((value) => (
              <SelectItem key={value} value={String(value)}>
                {value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sort} onValueChange={(value) => setSort(value as SortMode)}>
          <SelectTrigger className="h-9 w-auto min-w-[8rem] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest first</SelectItem>
            <SelectItem value="oldest">Oldest first</SelectItem>
            <SelectItem value="title">Title A–Z</SelectItem>
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch("");
              setType("all");
              setSubjectId("all");
              setYear("all");
            }}
          >
            <X className="h-3.5 w-3.5" />
            Clear
          </Button>
        )}
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="overflow-hidden rounded-2xl border border-border">
              <Skeleton className="h-28 w-full rounded-none sm:h-36" />
              <div className="space-y-2 p-4">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : materials.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="h-5 w-5" />}
          title={hasFilters ? "Nothing matches those filters" : "The library is empty"}
          description={
            hasFilters
              ? "Try a different search term or clear the filters."
              : "Add the first book, PYQ set or YouTube lecture for your group."
          }
          action={
            hasFilters ? (
              <Button
                variant="outline"
                onClick={() => {
                  setSearch("");
                  setType("all");
                  setSubjectId("all");
                  setYear("all");
                }}
              >
                Clear filters
              </Button>
            ) : (
              <Button onClick={() => setFormOpen(true)}>
                <Plus className="h-4 w-4" />
                Add the first item
              </Button>
            )
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {materials.map((material) => (
            <MaterialCard
              key={material.$id}
              material={material}
              currentUser={currentUser}
              saved={savedIds.has(material.$id)}
              onToggleSave={toggleSave}
              onEdit={(item) => {
                setEditing(item as Material);
                setFormOpen(true);
              }}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <MaterialForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditing(null);
        }}
        subjects={subjects}
        material={editing}
        onSaved={() => {
          void load();
          router.refresh();
        }}
      />
    </div>
  );
}
