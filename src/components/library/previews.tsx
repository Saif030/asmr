"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * In-browser PDF preview using the native browser viewer.
 * No third-party viewer, no paid service — the iframe renders the PDF itself.
 */
export function PdfPreview({
  url,
  fileName,
}: {
  url: string;
  fileName?: string | null;
}) {
  const [zoom, setZoom] = React.useState(1);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 rounded-xl border border-border bg-surface px-3 py-2">
        <span className="min-w-0 truncate text-xs text-foreground-muted">{fileName ?? "Document"}</span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Zoom out"
            onClick={() => setZoom((z) => Math.max(0.6, +(z - 0.1).toFixed(2)))}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="w-12 text-center text-xs tabular-nums text-foreground-muted">
            {Math.round(zoom * 100)}%
          </span>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Zoom in"
            onClick={() => setZoom((z) => Math.min(2.5, +(z + 0.1).toFixed(2)))}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Reset zoom"
            onClick={() => setZoom(1)}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-surface">
        <iframe
          src={`${url}#toolbar=0&navpanes=0&view=FitH&zoom=${Math.round(zoom * 100)}`}
          title={fileName ?? "PDF preview"}
          className="h-[70dvh] w-full bg-white"
        />
      </div>
    </div>
  );
}

/** Simple image lightbox with keyboard navigation. */
export function ImageLightbox({
  images,
  index,
  onClose,
  onIndexChange,
}: {
  images: string[];
  index: number;
  onClose: () => void;
  onIndexChange: (index: number) => void;
}) {
  React.useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") onIndexChange((index + 1) % images.length);
      if (event.key === "ArrowLeft") onIndexChange((index - 1 + images.length) % images.length);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, images.length, onClose, onIndexChange]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/80 p-4"
      onClick={onClose}
    >
      <button
        type="button"
        aria-label="Close preview"
        onClick={onClose}
        className="absolute right-4 top-4 rounded-lg bg-background/90 px-3 py-1.5 text-sm font-medium text-foreground shadow-soft"
      >
        Close
      </button>

      {images.length > 1 && (
        <button
          type="button"
          aria-label="Previous image"
          onClick={(event) => {
            event.stopPropagation();
            onIndexChange((index - 1 + images.length) % images.length);
          }}
          className="absolute left-4 rounded-full bg-background/90 p-2 text-foreground shadow-soft"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      )}

      <img
        src={images[index]}
        alt=""
        onClick={(event) => event.stopPropagation()}
        className={cn("max-h-[88dvh] max-w-full rounded-xl object-contain shadow-lifted")}
      />

      {images.length > 1 && (
        <button
          type="button"
          aria-label="Next image"
          onClick={(event) => {
            event.stopPropagation();
            onIndexChange((index + 1) % images.length);
          }}
          className="absolute right-4 rounded-full bg-background/90 p-2 text-foreground shadow-soft"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
