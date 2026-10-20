import { NextResponse } from "next/server";
import { Account, ID, Query, TablesDB } from "node-appwrite";

import { DATABASE_ID, TABLES } from "@/lib/appwrite/config";
import { ownedRowPermissions } from "@/lib/appwrite/permissions";
import { createAdminClient, createSessionClient } from "@/lib/appwrite/server";
import { MESSAGES_PER_CHANNEL_LIMIT } from "@/lib/constants/limits";

/**
 * Creates a chat message.
 *
 * Messages go through the server so the 5,000-per-channel cap can be
 * enforced (Appwrite has no database triggers) and so every row is created
 * with the right owner permissions. Realtime still delivers the new row to
 * every subscriber.
 */
export async function POST(request: Request) {
  let body: {
    channelId?: string;
    text?: string;
    fileId?: string;
    materialId?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const channelId = body.channelId?.trim();
  const text = (body.text ?? "").trim();
  const fileId = body.fileId?.trim() || null;
  const materialId = body.materialId?.trim() || null;

  if (!channelId) {
    return NextResponse.json({ error: "channelId is required." }, { status: 400 });
  }
  if (!text && !fileId && !materialId) {
    return NextResponse.json({ error: "A message needs text, an image or an item." }, { status: 400 });
  }
  if (text.length > 4000) {
    return NextResponse.json({ error: "Messages are limited to 4000 characters." }, { status: 400 });
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

  const row = await tables.createRow({
    databaseId: DATABASE_ID,
    tableId: TABLES.messages,
    rowId: ID.unique(),
    data: {
      channelId,
      userId,
      body: text || null,
      fileId,
      materialId,
      createdAt: new Date().toISOString(),
    },
    permissions: ownedRowPermissions(userId),
  });

  // Keep only the newest messages so the database stays small.
  void trimChannel(tables, channelId);

  return NextResponse.json({ ok: true, message: row });
}

/** Deletes the oldest messages once a channel passes the cap. */
async function trimChannel(tables: TablesDB, channelId: string) {
  try {
    const { total } = await tables.listRows({
      databaseId: DATABASE_ID,
      tableId: TABLES.messages,
      queries: [Query.equal("channelId", channelId), Query.limit(1)],
      total: true,
    });

    let surplus = (total ?? 0) - MESSAGES_PER_CHANNEL_LIMIT;
    if (surplus <= 0) return;

    while (surplus > 0) {
      const { rows } = await tables.listRows({
        databaseId: DATABASE_ID,
        tableId: TABLES.messages,
        queries: [
          Query.equal("channelId", channelId),
          Query.orderAsc("createdAt"),
          Query.limit(Math.min(surplus, 100)),
        ],
      });
      if (!rows.length) return;

      await tables.deleteRows({
        databaseId: DATABASE_ID,
        tableId: TABLES.messages,
        queries: [
          Query.equal("channelId", channelId),
          Query.orderAsc("createdAt"),
          Query.limit(rows.length),
        ],
      });

      surplus -= rows.length;
    }
  } catch (error) {
    console.error("Could not trim the channel:", error);
  }
}
