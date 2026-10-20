"use client";

import * as React from "react";
import Link from "next/link";
import { FileText, ImageIcon, Link2, MoreHorizontal, Trash2, Youtube } from "lucide-react";

import { YouTubePreview } from "@/components/library/youtube-embed";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { chatImageUrl } from "@/lib/appwrite/files";
import { cn, formatTime, initialsFor } from "@/lib/utils";
import { extractLinks, extractYouTubeRefs, parseYouTubeUrl } from "@/lib/youtube";
import type { MessageWithRelations } from "@/types/appwrite";

/** Renders message text with clickable links while keeping it text-first. */
function MessageBody({ body }: { body: string }) {
  const parts = React.useMemo(() => body.split(/(https?:\/\/[^\s<>"']+)/g), [body]);

  return (
    <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground">
      {parts.map((part, index) => {
        if (!/^https?:\/\//i.test(part)) return <React.Fragment key={index}>{part}</React.Fragment>;
        const trimmed = part.replace(/[),.]+$/, "");
        const suffix = part.slice(trimmed.length);
        return (
          <React.Fragment key={index}>
            <a
              href={trimmed}
              target="_blank"
              rel="noreferrer noopener"
              className="font-medium text-accent underline underline-offset-2 hover:opacity-80"
            >
              {trimmed}
            </a>
            {suffix}
          </React.Fragment>
        );
      })}
    </p>
  );
}

export function MessageBubble({
  message,
  isOwn,
  canManage,
  onDelete,
  onOpenImage,
}: {
  message: MessageWithRelations;
  isOwn: boolean;
  canManage: boolean;
  onDelete?: (message: MessageWithRelations) => void;
  onOpenImage: (path: string) => void;
}) {
  const youtubeRefs = React.useMemo(
    () => (message.body ? extractYouTubeRefs(message.body) : []),
    [message.body],
  );
  const links = React.useMemo(
    () => (message.body ? extractLinks(message.body) : []).filter((url) => !parseYouTubeUrl(url)),
    [message.body],
  );

  const imageUrl = chatImageUrl(message.fileId);

  return (
    <div className={cn("flex gap-3 px-4 py-2", isOwn && "flex-row-reverse")}>
      <Avatar className="mt-0.5 h-8 w-8 shrink-0">
        <AvatarFallback
          style={{
            backgroundColor: `${message.author?.avatarColor ?? "#4F7CFF"}1A`,
            color: message.author?.avatarColor ?? "#4F7CFF",
            fontSize: "11px",
          }}
        >
          {initialsFor(message.author?.name ?? "?")}
        </AvatarFallback>
      </Avatar>

      <div className={cn("flex min-w-0 max-w-[min(42rem,85%)] flex-col gap-1.5", isOwn && "items-end")}>
        <div className={cn("flex items-baseline gap-2", isOwn && "flex-row-reverse")}>
          <span className="text-sm font-semibold text-foreground">
            {isOwn ? "You" : (message.author?.name ?? "Unknown")}
          </span>
          <time className="text-[11px] text-foreground-subtle" dateTime={message.createdAt}>
            {formatTime(message.createdAt)}
          </time>
          {canManage && onDelete && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label="Message actions"
                  className="rounded p-0.5 text-foreground-subtle transition-colors hover:bg-surface hover:text-foreground"
                >
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  destructive
                  onSelect={() => onDelete(message)}
                >
                  <Trash2 />
                  Delete message
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {message.body && (
          <div className={cn("rounded-2xl px-3.5 py-2", isOwn ? "bg-accent-soft" : "bg-surface")}>
            <MessageBody body={message.body} />
          </div>
        )}

        {youtubeRefs.map((ref) => (
          <YouTubePreview
            key={`${ref.type}-${ref.id}`}
            id={ref.id}
            type={ref.type}
            title={ref.type === "playlist" ? "YouTube playlist" : "YouTube video"}
            className="w-full max-w-sm"
          />
        ))}

        {links.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {links.map((url) => (
              <a
                key={url}
                href={url}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-border bg-background px-2 py-1 text-xs text-foreground-muted transition-colors hover:bg-surface"
              >
                <Link2 className="h-3 w-3 shrink-0" />
                <span className="truncate">{url}</span>
              </a>
            ))}
          </div>
        )}

        {imageUrl && (
          <button
            type="button"
            onClick={() => onOpenImage(imageUrl)}
            className="overflow-hidden rounded-2xl border border-border"
          >
            <img
              src={imageUrl}
              alt="Shared image"
              className="max-h-72 w-full max-w-sm object-cover transition-opacity hover:opacity-95"
            />
          </button>
        )}

        {message.material && (
          <Link
            href={`/library/${message.material.$id}`}
            className="flex max-w-sm items-center gap-3 rounded-2xl border border-border bg-background p-3 transition-colors hover:bg-surface"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
              {message.material.type === "youtube" ? (
                <Youtube className="h-4 w-4" />
              ) : message.material.type === "image" ? (
                <ImageIcon className="h-4 w-4" />
              ) : (
                <FileText className="h-4 w-4" />
              )}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium text-foreground">
                {message.material.title}
              </span>
              <span className="block text-xs text-foreground-subtle">Shared from the library</span>
            </span>
          </Link>
        )}
      </div>
    </div>
  );
}
