"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const isConfigError = /Appwrite is not configured/.test(error.message ?? "");

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-6">
      <div className="w-full max-w-md space-y-4 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-danger-soft text-danger">
          <AlertTriangle className="h-5 w-5" />
        </span>
        <div className="space-y-1">
          <h1 className="text-lg font-semibold text-foreground">
            {isConfigError ? "Appwrite is not configured" : "Something went wrong"}
          </h1>
          <p className="text-sm text-foreground-muted">
            {isConfigError
              ? "Copy .env.example to .env.local, add your Appwrite endpoint, project id and API key, then restart the dev server."
              : error.message || "The app could not start. Check the console for details."}
          </p>
        </div>
        <Button onClick={reset}>
          <RefreshCw className="h-4 w-4" />
          Try again
        </Button>
      </div>
    </div>
  );
}
