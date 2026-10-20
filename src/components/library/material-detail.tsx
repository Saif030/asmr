"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  Bookmark,
  Download,
  ExternalLink,
  FileText,
  MessageSquarePlus,
  Pencil,
  Trash2,
} from "lucide-react";

import { ImageLightbox, PdfPreview } from "@/components/library/previews";
import { YouTubeEmbed } from "@/components/library/youtube-embed";
import { MaterialForm } from "@/components/library/material-form";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppwrite } from "@/lib/appwrite/client";
import { BUCKETS, DATABASE_ID, TABLES } from "@/lib/appwrite/config";
import { materialDownloadUrl, materialFileUrl } from "@/lib/appwrite/files";
import { MATERIAL_TYPE_LABELS } from "@/lib/constants/limits";
import { formatBytes, formatDate, initialsFor } from "@/lib/utils";
import type { Channel, MaterialWithRelations, Profile, Subject } from "@/types/appwrite";

export function MaterialDetail({
  material,
  subjects,
  channels,
  currentUser,
  saved,
}: {
  material: MaterialWithRelations;
  subjects: Subject[];
  channels: Channel[];
  currentUser: Profile;
  saved: boolean;
}) {
  const router = useRouter();
  const { storage, tablesDB } = useAppwrite();
  const [isSaved, setIsSaved] = React.useState(saved);
  const [saving, setSaving] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [shareOpen, setShareOpen] = React.useState(false);
  const [channelId, setChannelId] = React.useState(channels[0]?.$id ?? "");
  const [lightboxOpen, setLightboxOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  const canManage = material.uploaderId === currentUser.userId || currentUser.isAdmin;
  const fileUrl = materialFileUrl(material.fileId);
  const downloadUrl = materialDownloadUrl(material.fileId);

  async function toggleSave() {
    setSaving(true);
    const next = !isSaved;
    setIsSaved(next);

    const response = await fetch("/api/saved", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ materialId: material.$id, action: next ? "save" : "unsave" }),
    }).catch(() => null);

    if (!response?.ok) {
      setIsSaved(!next);
      toast.error("Could not update your saved items.");
    } else {
      toast.success(next ? "Saved for later." : "Removed from saved.");
    }
    setSaving(false);
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await tablesDB.deleteRow({
        databaseId: DATABASE_ID,
        tableId: TABLES.materials,
        rowId: material.$id,
      });
      // The stored file goes with it.
      if (material.fileId) {
        await storage
          .deleteFile({ bucketId: BUCKETS.materials, fileId: material.fileId })
          .catch(() => undefined);
      }
      toast.success("Item deleted.");
      router.replace("/library");
      router.refresh();
    } catch (error) {
      toast.error(String((error as Error)?.message ?? "Could not delete that item."));
      setDeleting(false);
    }
  }

  async function shareToChat() {
    if (!channelId) {
      toast.error("Pick a channel first.");
      return;
    }
    const response = await fetch("/api/chat/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channelId, materialId: material.$id }),
    }).catch(() => null);

    if (!response?.ok) {
      toast.error("Could not share that item.");
      return;
    }
    toast.success("Shared in chat.");
    setShareOpen(false);
    router.push(`/chat/${channelId}`);
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href="/library">
          <ArrowLeft className="h-4 w-4" />
          Back to library
        </Link>
      </Button>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5">
          {material.kind === "file" && fileUrl && material.type === "image" && (
            <button
              type="button"
              onClick={() => setLightboxOpen(true)}
              className="block w-full overflow-hidden rounded-2xl border border-border"
            >
              <img src={fileUrl} alt={material.title} className="w-full object-contain" />
            </button>
          )}

          {material.kind === "file" && fileUrl && material.type !== "image" && (
            <PdfPreview url={fileUrl} fileName={material.fileName} />
          )}

          {material.kind === "youtube" && material.youtubeId && (
            <YouTubeEmbed
              ref={{
                id: material.youtubeId,
                type: material.youtubeType ?? "video",
                url: "",
              }}
              title={material.youtubeTitle ?? material.title}
            />
          )}

          {material.kind === "link" && material.linkUrl && (
            <a
              href={material.linkUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="flex items-center gap-4 rounded-2xl border border-border bg-surface px-5 py-6 transition-colors hover:bg-surface-strong"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-background text-foreground-muted shadow-subtle">
                <ExternalLink className="h-5 w-5" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-medium text-foreground">
                  Open the shared link
                </span>
                <span className="block truncate text-xs text-foreground-muted">
                  {material.linkUrl}
                </span>
              </span>
              <ExternalLink className="ml-auto h-4 w-4 shrink-0 text-foreground-subtle" />
            </a>
          )}

          <div className="space-y-3">
            <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              {material.title}
            </h1>

            {material.description && (
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground-muted">
                {material.description}
              </p>
            )}

            <div className="flex flex-wrap gap-1.5">
              <Badge>{MATERIAL_TYPE_LABELS[material.type] ?? material.type}</Badge>
              {material.subject && <Badge variant="outline">{material.subject.name}</Badge>}
              {material.exam && <Badge variant="outline">{material.exam}</Badge>}
              {material.year && <Badge variant="outline">{material.year}</Badge>}
              {material.tags.map((tag) => (
                <Badge key={tag} variant="solid">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-2xl border border-border bg-background p-4 shadow-subtle">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback
                  style={{
                    backgroundColor: `${material.uploader?.avatarColor ?? "#4F7CFF"}1A`,
                    color: material.uploader?.avatarColor ?? "#4F7CFF",
                  }}
                >
                  {initialsFor(material.uploader?.name ?? "?")}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  {material.uploader?.name ?? "Unknown"}
                </p>
                <p className="text-xs text-foreground-subtle">
                  Added {formatDate(material.createdAt)}
                </p>
              </div>
            </div>

            {material.fileSize ? (
              <p className="mt-3 flex items-center gap-1.5 text-xs text-foreground-muted">
                <FileText className="h-3.5 w-3.5" />
                {material.fileName} · {formatBytes(material.fileSize)}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            {material.kind === "file" && downloadUrl && (
              <Button className="w-full" asChild>
                <a href={downloadUrl} download={material.fileName ?? undefined} target="_blank" rel="noreferrer">
                  <Download className="h-4 w-4" />
                  Download
                </a>
              </Button>
            )}
            {material.kind === "link" && material.linkUrl && (
              <Button className="w-full" asChild>
                <a href={material.linkUrl} target="_blank" rel="noreferrer noopener">
                  <ExternalLink className="h-4 w-4" />
                  Open link
                </a>
              </Button>
            )}

            <Button
              variant="outline"
              className="w-full"
              loading={saving}
              onClick={toggleSave}
            >
              <Bookmark className={isSaved ? "fill-accent text-accent" : ""} />
              {isSaved ? "Saved" : "Save for later"}
            </Button>

            <Button variant="outline" className="w-full" onClick={() => setShareOpen(true)}>
              <MessageSquarePlus className="h-4 w-4" />
              Share in chat
            </Button>

            {canManage && (
              <div className="flex gap-2 pt-1">
                <Button variant="secondary" className="flex-1" onClick={() => setEditOpen(true)}>
                  <Pencil className="h-4 w-4" />
                  Edit
                </Button>
                <Button
                  variant="danger"
                  className="flex-1"
                  loading={deleting}
                  onClick={handleDelete}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </div>
            )}
          </div>
        </aside>
      </div>

      {lightboxOpen && fileUrl && (
        <ImageLightbox
          images={[fileUrl]}
          index={0}
          onClose={() => setLightboxOpen(false)}
          onIndexChange={() => undefined}
        />
      )}

      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share in chat</DialogTitle>
            <DialogDescription>
              Post this item as a card in one of your channels.
            </DialogDescription>
          </DialogHeader>

          <Select value={channelId} onValueChange={setChannelId}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a channel" />
            </SelectTrigger>
            <SelectContent>
              {channels.map((channel) => (
                <SelectItem key={channel.$id} value={channel.$id}>
                  #{channel.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setShareOpen(false)}>
              Cancel
            </Button>
            <Button onClick={shareToChat}>Post it</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <MaterialForm
        open={editOpen}
        onOpenChange={setEditOpen}
        subjects={subjects}
        material={material}
        onSaved={() => router.refresh()}
      />
    </div>
  );
}
