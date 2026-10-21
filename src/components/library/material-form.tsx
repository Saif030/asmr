"use client";

import * as React from "react";
import { toast } from "sonner";
import { FileText, Link2, Upload, Youtube, ImageIcon } from "lucide-react";
import { ID } from "appwrite";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useAppwrite } from "@/lib/appwrite/client";
import { BUCKETS, DATABASE_ID, TABLES } from "@/lib/appwrite/config";
import { buildSearchText } from "@/lib/appwrite/queries";
import { ownedRowPermissions } from "@/lib/appwrite/permissions";
import { MATERIAL_TYPE_LABELS, MATERIAL_TYPE_ORDER } from "@/lib/constants/limits";
import { compressImage } from "@/lib/image-compress";
import { isImageFile, isPdfFile, validateMaterialFile } from "@/lib/file-validation";
import { formatBytes } from "@/lib/utils";
import { parseYouTubeUrl } from "@/lib/youtube";
import type { Material, Subject } from "@/types/appwrite";

type Kind = "file" | "link" | "youtube";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subjects: Subject[];
  /** When provided the form edits an existing item instead of creating one. */
  material?: Material | null;
  onSaved?: (material: Material) => void;
};

const EMPTY = {
  title: "",
  description: "",
  type: "book",
  subjectId: "",
  exam: "",
  year: "",
  tags: "",
  linkUrl: "",
  youtubeUrl: "",
};

export function MaterialForm({ open, onOpenChange, subjects, material, onSaved }: Props) {
  const { storage, tablesDB, account, ready } = useAppwrite();
  const [kind, setKind] = React.useState<Kind>(material?.kind ?? "file");
  const [form, setForm] = React.useState(EMPTY);
  const [file, setFile] = React.useState<File | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [youtubeMeta, setYoutubeMeta] = React.useState<{ title: string } | null>(null);
  const [ytLoading, setYtLoading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Load existing values whenever the dialog opens.
  React.useEffect(() => {
    if (!open) return;
    if (material) {
      setKind(material.kind);
      setForm({
        title: material.title,
        description: material.description ?? "",
        type: material.type,
        subjectId: material.subjectId ?? "",
        exam: material.exam ?? "",
        year: material.year ? String(material.year) : "",
        tags: (material.tags ?? []).join(", "),
        linkUrl: material.linkUrl ?? "",
        youtubeUrl: material.youtubeId
          ? material.youtubeType === "playlist"
            ? `https://www.youtube.com/playlist?list=${material.youtubeId}`
            : `https://www.youtube.com/watch?v=${material.youtubeId}`
          : "",
      });
      setFile(null);
      setYoutubeMeta(material.youtubeTitle ? { title: material.youtubeTitle } : null);
    } else {
      setKind("file");
      setForm(EMPTY);
      setFile(null);
      setYoutubeMeta(null);
    }
  }, [open, material]);

  function set<K extends keyof typeof EMPTY>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onPickFile(event: React.ChangeEvent<HTMLInputElement>) {
    const picked = event.target.files?.[0];
    event.target.value = "";
    if (!picked) return;

    const validation = validateMaterialFile(picked);
    if (!validation.ok) {
      toast.error(validation.error);
      return;
    }

    setFile(picked);
    if (!form.title) set("title", picked.name.replace(/\.[^.]+$/, ""));
    if (isImageFile(picked)) set("type", "image");
    if (isPdfFile(picked)) set("type", "book");
  }

  async function onPickYouTubeUrl() {
    const ref = parseYouTubeUrl(form.youtubeUrl);
    if (!ref) {
      setYoutubeMeta(null);
      return;
    }
    setYtLoading(true);
    try {
      const response = await fetch(
        `/api/youtube/oembed?url=${encodeURIComponent(form.youtubeUrl)}`,
      );
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast.error(payload.error ?? "Could not read that YouTube link.");
        setYoutubeMeta(null);
        return;
      }
      setYoutubeMeta({ title: payload.title });
      if (!form.title) set("title", payload.title);
    } catch {
      toast.error("Network error while contacting YouTube.");
    } finally {
      setYtLoading(false);
    }
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.title.trim()) {
      toast.error("Give the item a title.");
      return;
    }
    if (!ready) {
      toast.error("Still connecting to Appwrite — try again in a moment.");
      return;
    }

    setBusy(true);

    try {
      const type = form.type;
      const subjectId = form.subjectId || null;
      const subjectName = subjects.find((s) => s.$id === subjectId)?.name ?? "";
      const exam = form.exam.trim() || null;
      const year = form.year ? Number(form.year) : null;
      const tags = form.tags
        .split(",")
        .map((tag) => tag.trim().toLowerCase())
        .filter(Boolean)
        .slice(0, 12);
      const description = form.description.trim() || null;

      let fileId = material?.fileId ?? null;
      let fileName = material?.fileName ?? null;
      let fileSize = material?.fileSize ?? null;
      let linkUrl = kind === "link" ? form.linkUrl.trim() || null : null;
      let youtubeId: string | null = null;
      let youtubeType: "video" | "playlist" | null = null;
      let youtubeTitle: string | null = null;
      const previousFileId = material?.fileId ?? null;

      if (kind === "file") {
        if (file) {
          // Guard the free-tier storage ceiling before pushing bytes.
          const usage = await fetch("/api/storage/usage").catch(() => null);
          if (usage?.ok) {
            const usageData = await usage.json();
            if (usageData.blocked) {
              toast.error(
                "Storage is nearly full on this plan. Delete a file or share a link instead.",
              );
              setBusy(false);
              return;
            }
          }

          let uploadFile = file;
          if (isImageFile(file)) {
            try {
              uploadFile = await compressImage(file);
            } catch {
              toast.error("Could not compress that image — try another one.");
              setBusy(false);
              return;
            }
          }

          const newFileId = ID.unique();
          try {
            const user = await account.get();
            await storage.createFile({
              bucketId: BUCKETS.materials,
              fileId: newFileId,
              file: uploadFile,
              permissions: [],
            });
          } catch (error) {
            toast.error(`Upload failed: ${String((error as Error)?.message)}`);
            setBusy(false);
            return;
          }

          fileId = newFileId;
          fileName = uploadFile.name;
          fileSize = uploadFile.size;
          linkUrl = null;
        } else if (!material?.fileId) {
          toast.error("Choose a file to upload, or switch to a link.");
          setBusy(false);
          return;
        }
      }

      if (kind === "link") {
        if (!linkUrl) {
          toast.error("Paste the link to share.");
          setBusy(false);
          return;
        }
        if (!/^https?:\/\//i.test(linkUrl)) {
          toast.error("The link must start with http:// or https://");
          setBusy(false);
          return;
        }
        fileId = null;
        fileName = null;
        fileSize = null;
      }

      if (kind === "youtube") {
        const ref = parseYouTubeUrl(form.youtubeUrl);
        if (!ref) {
          toast.error("That is not a valid YouTube video or playlist link.");
          setBusy(false);
          return;
        }
        youtubeId = ref.id;
        youtubeType = ref.type;
        youtubeTitle = youtubeMeta?.title ?? form.title;
        fileId = null;
        fileName = null;
        fileSize = null;
        linkUrl = null;
      }

      const data = {
        title: form.title.trim(),
        description,
        type,
        subjectId,
        exam,
        year: Number.isFinite(year as number) ? year : null,
        tags,
        kind,
        fileId,
        fileName,
        fileSize,
        linkUrl,
        youtubeId,
        youtubeType,
        youtubeTitle,
        searchText: buildSearchText(form.title.trim(), tags, subjectName),
      };

      if (material) {
        try {
          const updated = await tablesDB.updateRow({
            databaseId: DATABASE_ID,
            tableId: TABLES.materials,
            rowId: material.$id,
            data,
          });
          onSaved?.(updated as unknown as Material);
        } catch (error) {
          toast.error(String((error as Error)?.message ?? "Could not update that item."));
          setBusy(false);
          return;
        }

        // The replaced file is no longer referenced — remove it from Storage.
        if (previousFileId && previousFileId !== fileId) {
          await storage
            .deleteFile({ bucketId: BUCKETS.materials, fileId: previousFileId })
            .catch(() => undefined);
        }
      } else {
        const response = await fetch("/api/materials", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...data, subjectName }),
        });
        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
          toast.error(payload.error ?? "Could not add that item.");
          setBusy(false);
          return;
        }
        onSaved?.(payload.material as Material);
      }

      toast.success(material ? "Item updated." : "Added to the library.");
      onOpenChange(false);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{material ? "Edit item" : "Add to the library"}</DialogTitle>
          <DialogDescription>
            Upload a small file, share an external link, or paste a YouTube link.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <Tabs value={kind} onValueChange={(value) => setKind(value as Kind)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="file">
                <Upload className="mr-1.5 h-3.5 w-3.5" />
                Upload
              </TabsTrigger>
              <TabsTrigger value="link">
                <Link2 className="mr-1.5 h-3.5 w-3.5" />
                Link
              </TabsTrigger>
              <TabsTrigger value="youtube">
                <Youtube className="mr-1.5 h-3.5 w-3.5" />
                YouTube
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {kind === "file" && (
            <div className="space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,image/jpeg,image/png,image/webp,image/gif"
                onChange={onPickFile}
              />
              <Button
                type="button"
                variant="outline"
                className="h-auto w-full justify-start py-4"
                onClick={() => fileInputRef.current?.click()}
              >
                {file ? (
                  <span className="flex items-center gap-3 text-left">
                    {isImageFile(file) ? (
                      <ImageIcon className="h-4 w-4 text-accent" />
                    ) : (
                      <FileText className="h-4 w-4 text-accent" />
                    )}
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-foreground">
                        {file.name}
                      </span>
                      <span className="block text-xs text-foreground-subtle">
                        {formatBytes(file.size)} · ready to upload
                      </span>
                    </span>
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    Choose a file (PDF ≤ 100 MB, image ≤ 5 MB)
                  </span>
                )}
              </Button>
              <p className="rounded-xl bg-surface px-3 py-2 text-xs text-foreground-muted">
                Images are downscaled to 1600px and re-compressed before upload. For big
                books, switch to <strong className="font-medium">Link</strong> and share a
                Google Drive / Mega copy instead — it keeps our free storage healthy.
              </p>
            </div>
          )}

          {kind === "link" && (
            <div className="space-y-2">
              <Label htmlFor="linkUrl">External link</Label>
              <Input
                id="linkUrl"
                type="url"
                inputMode="url"
                placeholder="https://drive.google.com/…"
                value={form.linkUrl}
                onChange={(e) => set("linkUrl", e.target.value)}
              />
              <p className="text-xs text-foreground-subtle">
                Perfect for full textbooks — no size limit, nothing stored on our account.
              </p>
            </div>
          )}

          {kind === "youtube" && (
            <div className="space-y-2">
              <Label htmlFor="youtubeUrl">YouTube link</Label>
              <div className="flex gap-2">
                <Input
                  id="youtubeUrl"
                  type="url"
                  inputMode="url"
                  placeholder="https://www.youtube.com/watch?v=…"
                  value={form.youtubeUrl}
                  onChange={(e) => set("youtubeUrl", e.target.value)}
                  onBlur={onPickYouTubeUrl}
                />
                <Button
                  type="button"
                  variant="secondary"
                  loading={ytLoading}
                  onClick={onPickYouTubeUrl}
                >
                  Fetch
                </Button>
              </div>
              {youtubeMeta && (
                <p className="text-xs text-foreground-muted">
                  Found: <span className="font-medium text-foreground">{youtubeMeta.title}</span>
                </p>
              )}
              <p className="text-xs text-foreground-subtle">
                Title and thumbnail come from the free oEmbed endpoint — no API key needed.
              </p>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                required
                placeholder="Physics — Class 12 NCERT"
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select value={form.type} onValueChange={(value) => set("type", value)}>
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MATERIAL_TYPE_ORDER.map((value) => (
                    <SelectItem key={value} value={value}>
                      {MATERIAL_TYPE_LABELS[value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Select
                value={form.subjectId || "none"}
                onValueChange={(value) => set("subjectId", value === "none" ? "" : value)}
              >
                <SelectTrigger id="subject">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No subject</SelectItem>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.$id} value={subject.$id}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="exam">Exam / class</Label>
              <Input
                id="exam"
                placeholder="JEE, NEET, Class 12…"
                value={form.exam}
                onChange={(e) => set("exam", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="year">Year</Label>
              <Input
                id="year"
                type="number"
                inputMode="numeric"
                placeholder="2024"
                min={1990}
                max={2100}
                value={form.year}
                onChange={(e) => set("year", e.target.value)}
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                placeholder="mechanics, chapter-1, important"
                value={form.tags}
                onChange={(e) => set("tags", e.target.value)}
              />
              <p className="text-xs text-foreground-subtle">Separate tags with commas.</p>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                rows={3}
                placeholder="What is inside, who should read it, any caveats…"
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={busy}>
              {material ? "Save changes" : "Add item"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
