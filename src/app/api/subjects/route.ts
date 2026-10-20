import { NextResponse } from "next/server";
import { Account, ID, Query, TablesDB } from "node-appwrite";

import { DATABASE_ID, TABLES } from "@/lib/appwrite/config";
import { createAdminClient, createSessionClient } from "@/lib/appwrite/server";

/**
 * GET - List all subjects
 */
export async function GET() {
  const tables = new TablesDB(createAdminClient());

  try {
    const { rows } = await tables.listRows({
      databaseId: DATABASE_ID,
      tableId: TABLES.subjects,
      queries: [Query.orderAsc("name"), Query.limit(100)],
    });

    return NextResponse.json({ subjects: rows });
  } catch (error) {
    console.error("Failed to list subjects:", error);
    return NextResponse.json({ error: "Failed to list subjects" }, { status: 500 });
  }
}

/**
 * POST - Create a new subject
 */
export async function POST(request: Request) {
  let body: Record<string, unknown>;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
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

  const name = String(body.name ?? "").trim();
  if (!name) {
    return NextResponse.json({ error: "Subject name is required." }, { status: 400 });
  }

  // Generate slug from name
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const tables = new TablesDB(createAdminClient());

  try {
    const row = await tables.createRow({
      databaseId: DATABASE_ID,
      tableId: TABLES.subjects,
      rowId: ID.unique(),
      data: {
        name,
        slug,
        createdBy: userId,
        createdAt: new Date().toISOString(),
      },
    });

    return NextResponse.json({ ok: true, subject: row });
  } catch (error: any) {
    console.error("Failed to create subject:", error);
    return NextResponse.json({ error: "Failed to create subject" }, { status: 500 });
  }
}

/**
 * PUT - Update a subject
 */
export async function PUT(request: Request) {
  let body: Record<string, unknown>;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const sessionClient = await createSessionClient();
  const account = new Account(sessionClient);

  try {
    await account.get();
  } catch {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const id = String(body.id ?? "").trim();
  const name = String(body.name ?? "").trim();

  if (!id) {
    return NextResponse.json({ error: "Subject ID is required." }, { status: 400 });
  }
  if (!name) {
    return NextResponse.json({ error: "Subject name is required." }, { status: 400 });
  }

  // Generate slug from name
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const tables = new TablesDB(createAdminClient());

  try {
    const row = await tables.updateRow({
      databaseId: DATABASE_ID,
      tableId: TABLES.subjects,
      rowId: id,
      data: {
        name,
        slug,
      },
    });

    return NextResponse.json({ ok: true, subject: row });
  } catch (error: any) {
    console.error("Failed to update subject:", error);
    return NextResponse.json({ error: "Failed to update subject" }, { status: 500 });
  }
}

/**
 * DELETE - Delete a subject
 */
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Subject ID is required." }, { status: 400 });
  }

  const sessionClient = await createSessionClient();
  const account = new Account(sessionClient);

  try {
    await account.get();
  } catch {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const tables = new TablesDB(createAdminClient());

  try {
    await tables.deleteRow({
      databaseId: DATABASE_ID,
      tableId: TABLES.subjects,
      rowId: id,
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Failed to delete subject:", error);
    return NextResponse.json({ error: "Failed to delete subject" }, { status: 500 });
  }
}
