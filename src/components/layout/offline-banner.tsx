"use client";

import { CloudOff } from "lucide-react";

import { useOnlineStatus } from "@/hooks/use-online-status";

/** Slim banner shown only while the browser reports no connectivity. */
export function OfflineBanner() {
  const online = useOnlineStatus();

  if (online) return null;

  return (
    <div className="flex items-center justify-center gap-2 bg-[#fff7ed] px-4 py-2 text-xs font-medium text-[#c2410c]">
      <CloudOff className="h-3.5 w-3.5" />
      You are offline. Changes will fail until the connection is back.
    </div>
  );
}
