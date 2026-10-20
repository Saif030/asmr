"use client";

import * as React from "react";
import { toast } from "sonner";
import { Bookmark } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Single bookmark toggle used on cards across the app. */
export function SaveButton({
  materialId,
  initialSaved,
  className,
  variant = "ghost",
  size = "icon-sm",
}: {
  materialId: string;
  initialSaved: boolean;
  className?: string;
  variant?: "ghost" | "outline";
  size?: "icon-sm" | "sm";
}) {
  const [saved, setSaved] = React.useState(initialSaved);
  const [busy, setBusy] = React.useState(false);

  async function toggle(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    setBusy(true);

    const next = !saved;
    setSaved(next);

    try {
      const response = await fetch("/api/saved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ materialId, action: next ? "save" : "unsave" }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        setSaved(!next);
        toast.error(payload.error ?? "Could not update your saved items.");
        return;
      }

      toast.success(next ? "Saved for later." : "Removed from saved.");
    } catch {
      setSaved(!next);
      toast.error("Network error — check your connection.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      disabled={busy}
      onClick={toggle}
      aria-label={saved ? "Remove from saved" : "Save for later"}
      className={cn(saved && "text-accent", className)}
    >
      <Bookmark className={cn(saved && "fill-accent")} />
      {size === "sm" && <span>{saved ? "Saved" : "Save"}</span>}
    </Button>
  );
}
