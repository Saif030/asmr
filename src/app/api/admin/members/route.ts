import { NextResponse } from "next/server";
import { Account, ID, Query, TablesDB, Teams, Users } from "node-appwrite";

import { ADMIN_TEAM_ID, DATABASE_ID, TABLES } from "@/lib/appwrite/config";
import { createAdminClient, createSessionClient } from "@/lib/appwrite/server";

/**
 * Admin member management.
 *
 * The caller must be a member of the "admins" team; Appwrite then also
 * enforces the permissions on every row, so this route only adds the
 * operations an API key is needed for (deleting the account itself).
 */
export async function DELETE(request: Request) {
  let body: { userId?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const userId = body.userId?.trim();
  if (!userId) {
    return NextResponse.json({ error: "userId is required." }, { status: 400 });
  }

  const sessionClient = await createSessionClient();
  const account = new Account(sessionClient);

  let currentUserId: string;
  try {
    const user = await account.get();
    currentUserId = user.$id;
  } catch {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  if (currentUserId === userId) {
    return NextResponse.json({ error: "You cannot remove yourself." }, { status: 400 });
  }

  const admin = createAdminClient();
  const teams = new Teams(admin);
  const users = new Users(admin);

  // Membership of the admins team is the source of truth for admin rights.
  try {
    await teams.getMembership(ADMIN_TEAM_ID, currentUserId);
  } catch {
    return NextResponse.json(
      { error: "Only admins can remove members." },
      { status: 403 },
    );
  }

  try {
    await users.delete(userId);
  } catch (error) {
    return NextResponse.json(
      { error: `Could not remove that member: ${String((error as Error)?.message)}` },
      { status: 400 },
    );
  }

  // Clean up the rows that belong to the removed member.
  await Promise.all([
    deleteRows(TABLES.profiles, `equal("userId", "${userId}")`),
    deleteRows(TABLES.savedMaterials, `equal("userId", "${userId}")`),
    deleteRows(TABLES.channelReads, `equal("userId", "${userId}")`),
  ]);

  return NextResponse.json({ ok: true, mode: "deleted" });
}

async function deleteRows(tableId: string, where: string) {
  try {
    const tables = new TablesDB(createAdminClient());
    const { rows } = await tables.listRows({
      databaseId: DATABASE_ID,
      tableId,
      queries: [where, Query.limit(100)],
    });
    if (rows.length) {
      await tables.deleteRows({
        databaseId: DATABASE_ID,
        tableId,
        queries: [where, Query.limit(rows.length)],
      });
    }
  } catch (error) {
    console.error(`Could not clean up ${tableId}:`, error);
  }
}

export { ID };
