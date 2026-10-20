/**
 * Server-side environment helpers.
 * Only NEXT_PUBLIC_* values are ever exposed to the browser.
 */

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing environment variable ${name}. Copy .env.example to .env.local and fill it in.`,
    );
  }
  return value;
}

export function serverEnv() {
  return {
    inviteCode: process.env.INVITE_CODE?.trim() ?? "",
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "",
    appUrl: process.env.NEXT_PUBLIC_APP_URL?.trim() ?? "",
  };
}
