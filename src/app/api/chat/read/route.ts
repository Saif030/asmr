import { NextResponse } from "next/server";
import { Account, ID, Query, TablesDB } from "node-appwrite";

import { DATABASE_ID, TABLES } from "@/lib/appwrite/config";
import { privateRowPermissions } from "@/lib/appwrite/permissions";
import { createAdminClient, createSessionClient } from "@/lib/appwrite/server";

/**
 * Marks a channel as read for the current member, which drives the unread
 * dot next to each channel.
 */
export async function POST(request: Request) {
  let body: { channelId?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const channelId = body.channelId?.trim();
  if (!channelId) {
    return NextResponse.json({ error: "channelId is required." }, { status: 400 });
  }

  const sessionClient = await createSessionClient();
  const account = new Account(sessionClient);

  let userId: string;
  try {
    const user = await account.get();
    userId = user.$id;
  } catch {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const tables = new TablesDB(createAdminClient());
  const now = new Date().toISOString();

  const { rows } = await tables.listRows({
    databaseId: DATABASE_ID,
    tableId: TABLES.channelReads,
    queries: [
      Query.equal("channelId", channelId),
      Query.equal("userId", userId),
      Query.limit(1),
    ],
  });

  if (rows[0]) {
    await tables.updateRow({
      databaseId: DATABASE_ID,
      tableId: TABLES.channelReads,
      rowId: rows[0].$id,
      data: { lastReadAt: now },
    });
  } else {
    await tables.createRow({
      databaseId: DATABASE_ID,
      tableId: TABLES.channelReads,
      rowId: ID.unique(),
      data: { channelId, userId, lastReadAt: now },
      permissions: privateRowPermissions(userId),
    });
  }

  return NextResponse.json({ ok: true, lastReadAt: now });
}
