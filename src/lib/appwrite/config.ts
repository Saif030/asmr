/**
 * Appwrite project configuration.
 *
 * Every id lives here so the rest of the app never hard-codes a magic string.
 * The ids match what `tools/appwrite-setup.mjs` creates.
 */

export const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID ?? "khatmal";

export const TABLES = {
  profiles: "profiles",
  subjects: "subjects",
  materials: "materials",
  savedMaterials: "saved_materials",
  channels: "channels",
  messages: "messages",
  channelReads: "channel_reads",
} as const;

export type TableId = (typeof TABLES)[keyof typeof TABLES];

/** One bucket for library files and one for chat pictures. */
export const BUCKETS = {
  materials: process.env.NEXT_PUBLIC_APPWRITE_BUCKET_MATERIALS ?? "materials",
  chat: process.env.NEXT_PUBLIC_APPWRITE_BUCKET_CHAT ?? "chat-images",
} as const;

export const ADMIN_TEAM_ID = process.env.APPWRITE_ADMIN_TEAM_ID ?? "admins";

/** File id prefixes keep library files and chat images apart in one bucket. */
export const FILE_PREFIX = {
  material: "mat_",
  chat: "chat_",
} as const;/** Appwrite's free project pauses after 7 days without activity. */
export const KEEPALIVE_NOTE =
  "Appwrite pauses free projects after 7 days of inactivity. The keepalive route and the GitHub Actions workflow keep it awake.";

export function endpoint(): string {
  const value = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
  if (!value) {
    throw new Error(
      "Appwrite is not configured. Copy .env.example to .env.local, set NEXT_PUBLIC_APPWRITE_ENDPOINT and NEXT_PUBLIC_APPWRITE_PROJECT_ID, then restart the dev server.",
    );
  }
  return value;
}

export function projectId(): string {
  const value = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
  if (!value) {
    throw new Error(
      "Appwrite is not configured. Copy .env.example to .env.local, set NEXT_PUBLIC_APPWRITE_ENDPOINT and NEXT_PUBLIC_APPWRITE_PROJECT_ID, then restart the dev server.",
    );
  }
  return value;
}

export function apiKey(): string {
  const value = process.env.APPWRITE_API_KEY;
  if (!value) {
    throw new Error(
      "APPWRITE_API_KEY is missing. Create an API key in Appwrite (Overview → Integrations → API Keys) and add it to .env.local.",
    );
  }
  return value;
}

/** Name of the cookie that holds the Appwrite session secret. */
export function sessionCookieName(): string {
  return `a_session_${projectId()}`;
}
