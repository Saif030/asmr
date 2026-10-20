import { NextResponse } from "next/server";
import { Account, Query, TablesDB } from "node-appwrite";
import { cookies } from "next/headers";

import { DATABASE_ID, TABLES, sessionCookieName } from "@/lib/appwrite/config";
import { createAdminClient } from "@/lib/appwrite/server";

/**
 * Server-side sign in.
 *
 * Sign in happens on the server so the session secret never has to travel
 * through client JavaScript, and so a member removed by an admin can be
 * refused here.
 */
export async function POST(request: Request) {
  let body: { email?: string; password?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const email = (body.email ?? "").trim().toLowerCase();
  const password = body.password ?? "";

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  const admin = createAdminClient();
  const account = new Account(admin);

  let session;
  try {
    session = await account.createEmailPasswordSession({ email, password });
  } catch {
    return NextResponse.json(
      { error: "That email and password combination does not match." },
      { status: 401 },
    );
  }

  // A removed member must not be able to sign back in.
  const tables = new TablesDB(admin);
  try {
    const { rows } = await tables.listRows({
      databaseId: DATABASE_ID,
      tableId: TABLES.profiles,
      queries: [Query.equal("userId", session.userId)],
    });
    if (rows[0]?.removed) {
      await account.deleteSession(session.$id);
      return NextResponse.json(
        { error: "This account has been removed from the group." },
        { status: 403 },
      );
    }
  } catch {
    // No profile yet — allow the sign-in, the layout creates the fallback.
  }

  const cookieStore = await cookies();
  cookieStore.set(sessionCookieName(), session.secret, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: new Date(session.expire),
  });

  return NextResponse.json({ ok: true });
}
