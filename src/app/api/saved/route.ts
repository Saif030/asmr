import { NextResponse } from "next/server";
import { Account, ID, Query, TablesDB } from "node-appwrite";

import { DATABASE_ID, TABLES } from "@/lib/appwrite/config";
import { privateRowPermissions } from "@/lib/appwrite/permissions";
import { createAdminClient, createSessionClient } from "@/lib/appwrite/server";

/** Adds or removes a bookmark for the signed-in member. */
export async function POST(request: Request) {
  let body: { materialId?: string; action?: "save" | "unsave" };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const materialId = body.materialId?.trim();
  if (!materialId) {
    return NextResponse.json({ error: "materialId is required." }, { status: 400 });
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

  const { rows } = await tables.listRows({
    databaseId: DATABASE_ID,
    tableId: TABLES.savedMaterials,
    queries: [
      Query.equal("userId", userId),
      Query.equal("materialId", materialId),
      Query.limit(1),
    ],
  });
  const existing = rows[0];

  if (body.action === "unsave") {
    if (existing) {
      await tables.deleteRow({
        databaseId: DATABASE_ID,
        tableId: TABLES.savedMaterials,
        rowId: existing.$id,
      });
    }
    return NextResponse.json({ ok: true, saved: false });
  }

  if (!existing) {
    try {
      await tables.createRow({
        databaseId: DATABASE_ID,
        tableId: TABLES.savedMaterials,
        rowId: ID.unique(),
        data: { userId, materialId, createdAt: new Date().toISOString() },
        permissions: privateRowPermissions(userId),
      });
    } catch (error) {
      const message = String((error as Error)?.message ?? error);
      if (!/already exists|409/i.test(message)) {
        return NextResponse.json({ error: message }, { status: 400 });
      }
    }
  }

  return NextResponse.json({ ok: true, saved: true });
}
