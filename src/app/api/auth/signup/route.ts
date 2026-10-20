import { NextResponse } from "next/server";
import { Account, ID, Query, Teams, TablesDB, Users } from "node-appwrite";
import { cookies } from "next/headers";

import { DATABASE_ID, TABLES, ADMIN_TEAM_ID, sessionCookieName } from "@/lib/appwrite/config";
import { createAdminClient } from "@/lib/appwrite/server";
import { ownedRowPermissions } from "@/lib/appwrite/permissions";
import { avatarColorFor } from "@/lib/utils";

/**
 * Signup endpoint.
 *
 * The invite code is checked here (server side) so INVITE_CODE never has to
 * be a public env var. Email + password only, and Appwrite's email
 * verification is switched off in the console, so nothing is emailed.
 */
export async function POST(request: Request) {
  let body: { email?: string; password?: string; name?: string; inviteCode?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const email = (body.email ?? "").trim().toLowerCase();
  const password = body.password ?? "";
  const name = (body.name ?? "").trim();
  const inviteCode = (body.inviteCode ?? "").trim();

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters." },
      { status: 400 },
    );
  }

  const expectedCode = process.env.INVITE_CODE?.trim();
  if (!expectedCode) {
    return NextResponse.json(
      { error: "Signups are disabled: INVITE_CODE is not configured on the server." },
      { status: 503 },
    );
  }
  if (inviteCode.toLowerCase() !== expectedCode.toLowerCase()) {
    return NextResponse.json({ error: "That invite code is not valid." }, { status: 403 });
  }

  const admin = createAdminClient();
  const users = new Users(admin);
  const tables = new TablesDB(admin);
  const teams = new Teams(admin);

  // The very first member becomes an admin (and joins the admins team).
  const existingProfiles = await tables.listRows({
    databaseId: DATABASE_ID,
    tableId: TABLES.profiles,
    queries: [Query.limit(1)],
  });
  const isFirstUser = (existingProfiles.total ?? 0) === 0;

  const userId = ID.unique();

  try {
    await users.create({ userId, email, password, name: name || email.split("@")[0] });
  } catch (error) {
    const message = String((error as Error)?.message ?? error);
    if (/already exists|409/i.test(message)) {
      return NextResponse.json(
        { error: "That email is already registered. Try logging in instead." },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const displayName = name || email.split("@")[0];

  await tables.createRow({
    databaseId: DATABASE_ID,
    tableId: TABLES.profiles,
    rowId: ID.unique(),
    data: {
      userId,
      name: displayName,
      avatarColor: avatarColorFor(userId),
      exam: null,
      isAdmin: isFirstUser,
      removed: false,
      createdAt: new Date().toISOString(),
    },
    permissions: ownedRowPermissions(userId),
  });

  if (isFirstUser) {
    try {
      await teams.createMembership({
        teamId: ADMIN_TEAM_ID,
        roles: ["admin"],
        userId,
      });
    } catch (error) {
      console.error("Could not add the first member to the admins team:", error);
    }
  }

  // Create the session server-side and hand it to the browser as a cookie.
  const account = new Account(admin);
  let session;
  try {
    session = await account.createEmailPasswordSession({ email, password });
  } catch (error) {
    return NextResponse.json(
      { error: `The account was created but sign-in failed: ${String((error as Error)?.message)}` },
      { status: 500 },
    );
  }

  const cookieStore = await cookies();
  cookieStore.set(sessionCookieName(), session.secret, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: new Date(session.expire),
  });

  return NextResponse.json({ ok: true, userId, isAdmin: isFirstUser });
}
