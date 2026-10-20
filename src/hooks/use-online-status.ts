"use client";

import * as React from "react";

/** Tracks browser connectivity so the UI can warn before a doomed request. */
export function useOnlineStatus() {
  const [online, setOnline] = React.useState(true);

  React.useEffect(() => {
    setOnline(navigator.onLine);

    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);

    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  return online;
}
