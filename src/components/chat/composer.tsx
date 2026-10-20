"use client";

import * as React from "react";
import { toast } from "sonner";
import { ID } from "appwrite";
import { ImagePlus, Loader2, Paperclip, SendHorizontal, X } from "lucide-react";

import { MaterialPicker } from "@/components/chat/material-picker";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAppwrite } from "@/lib/appwrite/client";
import { BUCKETS } from "@/lib/appwrite/config";
import { ownedRowPermissions } from "@/lib/appwrite/permissions";
import { compressChatImage } from "@/lib/image-compress";
import { validateChatImage } from "@/lib/file-validation";
import { cn } from "@/lib/utils";
import type { Material } from "@/types/appwrite";

export function Composer({
  channelId,
  userId,
  disabled,
  onSent,
}: {
  channelId: string;
  userId: string;
  disabled?: boolean;
  onSent?: () => void;
}) {
  const { storage, ready } = useAppwrite();
  const [body, setBody] = React.useState("");
  const [image, setImage] = React.useState<File | null>(null);
  const [material, setMaterial] = React.useState<Material | null>(null);
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [sending, setSending] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  async function onPickImage(event: React.ChangeEvent<HTMLInputElement>) {
    const picked = event.target.files?.[0];
    event.target.value = "";
    if (!picked) return;

    const validation = validateChatImage(picked);
    if (!validation.ok) {
      toast.error(validation.error);
      return;
    }

    setUploading(true);
    try {
      const compressed = await compressChatImage(picked);
      const check = validateChatImage(compressed);
      if (!check.ok) {
        toast.error(check.error);
        setUploading(false);
        return;
      }
      setImage(compressed);
    } catch {
      toast.error("Could not process that image.");
    } finally {
      setUploading(false);
    }
  }

  async function send() {
    const text = body.trim();
    if (!text && !image && !material) return;
    if (!ready) {
      toast.error("Still connecting to Appwrite — try again in a moment.");
      return;
    }

    setSending(true);

    try {
      let fileId: string | null = null;

      if (image) {
        const newFileId = ID.unique();
        try {
          await storage.createFile({
            bucketId: BUCKETS.chat,
            fileId: newFileId,
            file: image,
            permissions: ownedRowPermissions(userId),
          });
        } catch (error) {
          toast.error(`Image upload failed: ${String((error as Error)?.message)}`);
          setSending(false);
          return;
        }
        fileId = newFileId;
      }

      const response = await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channelId,
          text,
          fileId,
          materialId: material?.$id ?? null,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        // Roll the uploaded image back so we do not leak storage bytes.
        if (fileId) {
          await storage
            .deleteFile({ bucketId: BUCKETS.chat, fileId })
            .catch(() => undefined);
        }
        toast.error(payload.error ?? "Message failed to send.");
        setSending(false);
        return;
      }

      setBody("");
      setImage(null);
      setMaterial(null);
      onSent?.();
      textareaRef.current?.focus();
    } catch {
      toast.error("Message failed to send. Check your connection.");
    } finally {
      setSending(false);
    }
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void send();
    }
  }

  const canSend = Boolean(body.trim() || image || material);

  return (
    <div className="border-t border-border bg-background px-3 py-3 sm:px-4">
      {image || material ? (
        <div className="mb-2 flex flex-wrap items-center gap-2">
          {image && (
            <span className="flex items-center gap-2 rounded-xl border border-border bg-surface px-2.5 py-1.5 text-xs text-foreground-muted">
              <ImagePlus className="h-3.5 w-3.5" />
              {image.name}
              <button
                type="button"
                aria-label="Remove image"
                onClick={() => setImage(null)}
                className="rounded p-0.5 hover:bg-background"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          )}
          {material && (
            <span className="flex items-center gap-2 rounded-xl border border-border bg-surface px-2.5 py-1.5 text-xs text-foreground-muted">
              <Paperclip className="h-3.5 w-3.5" />
              <span className="max-w-[16rem] truncate">{material.title}</span>
              <button
                type="button"
                aria-label="Remove attachment"
                onClick={() => setMaterial(null)}
                className="rounded p-0.5 hover:bg-background"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          )}
        </div>
      ) : null}

      <div className="flex items-end gap-2">
        <input
          ref={fileRef}
          type="file"
          className="hidden"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={onPickImage}
        />

        <Button
          variant="ghost"
          size="icon"
          aria-label="Attach an image"
          disabled={disabled || uploading}
          onClick={() => fileRef.current?.click()}
          className="shrink-0"
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          aria-label="Attach a library item"
          disabled={disabled}
          onClick={() => setPickerOpen(true)}
          className="shrink-0"
        >
          <Paperclip className="h-4 w-4" />
        </Button>

        <Textarea
          ref={textareaRef}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={onKeyDown}
          rows={1}
          disabled={disabled}
          placeholder={disabled ? "Pick a channel to start chatting" : "Message your group…"}
          className={cn("max-h-40 min-h-10 resize-none py-2.5")}
        />

        <Button
          size="icon"
          aria-label="Send message"
          disabled={disabled || !canSend || sending}
          loading={sending}
          onClick={() => void send()}
          className="shrink-0"
        >
          <SendHorizontal className="h-4 w-4" />
        </Button>
      </div>

      <p className="mt-1.5 hidden text-[11px] text-foreground-subtle sm:block">
        Enter sends · Shift + Enter adds a new line · images are compressed automatically
      </p>

      <MaterialPicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelect={(selected) => {
          setMaterial(selected);
          setPickerOpen(false);
        }}
      />
    </div>
  );
}
