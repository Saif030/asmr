"use client";

import { Toaster as Sonner } from "sonner";

export function Toaster() {
  return (
    <Sonner
      position="bottom-right"
      closeButton
      richColors={false}
      toastOptions={{
        classNames: {
          toast:
            "group rounded-xl border border-border bg-background text-foreground shadow-soft text-sm",
          description: "text-foreground-muted",
          actionButton: "bg-accent text-accent-foreground rounded-lg text-xs px-2 py-1",
          cancelButton: "bg-surface text-foreground-muted rounded-lg text-xs px-2 py-1",
        },
      }}
    />
  );
}
