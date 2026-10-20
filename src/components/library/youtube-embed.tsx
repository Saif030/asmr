"use client";

import * as React from "react";
import { Play } from "lucide-react";

import { cn } from "@/lib/utils";
import { youtubeEmbedUrl, type YouTubeRef } from "@/lib/youtube";

/** Inline, privacy-enhanced YouTube player. */
export function YouTubeEmbed({
  ref: youTubeRef,
  className,
  title,
}: {
  ref: YouTubeRef;
  className?: string;
  title?: string;
}) {
  const [playing, setPlaying] = React.useState(false);

  // Facade pattern: the iframe (and its cookies) only loads after a click.
  if (!playing) {
    return (
      <button
        type="button"
        onClick={() => setPlaying(true)}
        className={cn(
          "group relative block aspect-video w-full overflow-hidden rounded-2xl border border-border bg-surface",
          className,
        )}
      >
        <img
          src={`https://img.youtube.com/vi/${youTubeRef.id}/hqdefault.jpg`}
          alt={title ?? "YouTube thumbnail"}
          className="h-full w-full object-cover"
        />
        <span className="absolute inset-0 flex items-center justify-center bg-foreground/10 transition-colors group-hover:bg-foreground/20">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-background/95 text-accent shadow-soft">
            <Play className="ml-0.5 h-6 w-6 fill-accent" />
          </span>
        </span>
      </button>
    );
  }

  return (
    <div className={cn("aspect-video w-full overflow-hidden rounded-2xl border border-border", className)}>
      <iframe
        src={youtubeEmbedUrl(youTubeRef)}
        title={title ?? "YouTube player"}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
        className="h-full w-full"
      />
    </div>
  );
}

/** Small static preview used in chat messages and library cards. */
export function YouTubePreview({
  id,
  type = "video",
  title,
  className,
}: {
  id: string;
  type?: "video" | "playlist";
  title?: string;
  className?: string;
}) {
  return (
    <a
      href={
        type === "playlist"
          ? `https://www.youtube.com/playlist?list=${id}`
          : `https://www.youtube.com/watch?v=${id}`
      }
      target="_blank"
      rel="noreferrer noopener"
      className={cn(
        "group flex items-center gap-3 rounded-xl border border-border bg-background p-2 transition-colors hover:bg-surface",
        className,
      )}
    >
      <span className="relative block h-14 w-24 shrink-0 overflow-hidden rounded-lg bg-surface-strong">
        <img
          src={`https://img.youtube.com/vi/${id}/hqdefault.jpg`}
          alt=""
          className="h-full w-full object-cover"
        />
        <span className="absolute inset-0 flex items-center justify-center bg-foreground/20">
          <Play className="h-4 w-4 fill-white text-white" />
        </span>
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium text-foreground">
          {title ?? "YouTube video"}
        </span>
        <span className="block text-xs text-foreground-subtle">Watch on YouTube</span>
      </span>
    </a>
  );
}
