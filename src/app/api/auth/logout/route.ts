import { NextResponse } from "next/server";
import { Account } from "node-appwrite";
import { cookies } from "next/headers";

import { sessionCookieName } from "@/lib/appwrite/config";
import { createSessionClient } from "@/lib/appwrite/server";

/** Ends the current session and clears the cookie. */
export async function POST(request: Request) {
  const client = await createSessionClient();
  const account = new Account(client);

  try {
    // Delete only the session that is being used, not every device.
    const { sessions } = await account.listSessions();
    const current = sessions.find((session) => session.current);
    if (current) await account.deleteSession(current.$id);
  } catch {
    // The session may already be gone — clearing the cookie is enough.
  }

  const cookieStore = await cookies();
  cookieStore.delete(sessionCookieName());

  return NextResponse.redirect(new URL("/login", request.url), { status: 303 });
}
