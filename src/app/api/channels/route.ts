import { NextResponse } from "next/server";
import { Account, ID, TablesDB } from "node-appwrite";

import { DATABASE_ID, TABLES } from "@/lib/appwrite/config";
import { ownedRowPermissions } from "@/lib/appwrite/permissions";
import { createAdminClient, createSessionClient } from "@/lib/appwrite/server";

/** Creates a chat channel. The creator comes from the session. */
export async function POST(request: Request) {
  let body: { name?: string; slug?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const name = (body.name ?? "").trim();
  if (!name) {
    return NextResponse.json({ error: "Give the channel a name." }, { status: 400 });
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

  const slug = (body.slug ?? name)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s-]+/g, "-")
    .slice(0, 40);

  const tables = new TablesDB(createAdminClient());

  try {
    const row = await tables.createRow({
      databaseId: DATABASE_ID,
      tableId: TABLES.channels,
      rowId: ID.unique(),
      data: { name, slug, createdBy: userId, createdAt: new Date().toISOString() },
      permissions: ownedRowPermissions(userId),
    });
    return NextResponse.json({ ok: true, channel: row });
  } catch (error) {
    const message = String((error as Error)?.message ?? error);
    if (/already exists|409/i.test(message)) {
      return NextResponse.json(
        { error: "A channel with that name already exists." },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
