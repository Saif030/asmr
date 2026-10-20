"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface the failure in the browser console for debugging.
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[60dvh] w-full max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-danger-soft text-danger">
        <AlertTriangle className="h-5 w-5" />
      </span>
      <div className="space-y-1">
        <h1 className="text-lg font-semibold text-foreground">Something went wrong</h1>
        <p className="text-sm text-foreground-muted">
          The page could not be loaded. It is often a temporary network issue.
        </p>
      </div>
      <Button onClick={reset}>
        <RefreshCw className="h-4 w-4" />
        Try again
      </Button>
    </div>
  );
}
