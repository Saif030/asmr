import { Client, ID } from "node-appwrite";
import { cookies } from "next/headers";

import { apiKey, endpoint, projectId, sessionCookieName } from "./config";

/**
 * Server-side Appwrite clients.
 *
 * A new Client instance is created per request — never share one between
 * requests, or a session could leak between users.
 */

/** Client acting as the signed-in member (their permissions apply). */
export async function createSessionClient() {
  // Read the cookie jar first: this marks the route as dynamic, so Next never
  // tries to prerender a page that depends on the request session.
  const cookieStore = await cookies();

  const client = new Client()
    .setEndpoint(endpoint())
    .setProject(projectId())
    .setSelfSigned(false);

  const session = cookieStore.get(sessionCookieName())?.value;

  if (session) {
    client.setSession(session);
  }

  return client;
}

/** Client acting with the API key — bypasses permissions for admin work. */
export function createAdminClient() {
  return new Client()
    .setEndpoint(endpoint())
    .setProject(projectId())
    .setKey(apiKey())
    .setSelfSigned(false);
}

export { ID };
