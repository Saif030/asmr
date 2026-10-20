"use client";

import { Account, Client, Storage, TablesDB, Teams } from "appwrite";
import * as React from "react";

import { endpoint, projectId } from "./config";

/**
 * Browser-side Appwrite client.
 *
 * The session secret is fetched from /api/auth/session (the server reads it
 * from the httpOnly cookie) and applied with setSession, which is what lets
 * the browser call Appwrite directly and receive Realtime events.
 */
let shared: Client | null = null;

export function appwriteClient(): Client {
  if (!shared) {
    shared = new Client().setEndpoint(endpoint()).setProject(projectId());
  }
  return shared;
}

export function useAppwrite() {
  const client = appwriteClient();
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch("/api/auth/session", { cache: "no-store" });
        if (response.ok) {
          const data = await response.json();
          if (data?.secret) client.setSession(data.secret);
        }
      } catch {
        // Offline or Appwrite unreachable — reads fail, the UI stays usable.
      } finally {
        if (!cancelled) setReady(true);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [client]);

  const services = React.useMemo(
    () => ({
      client,
      tablesDB: new TablesDB(client),
      storage: new Storage(client),
      account: new Account(client),
      teams: new Teams(client),
    }),
    [client],
  );

  return { ...services, ready };
}
