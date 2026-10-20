import { NextResponse } from "next/server";
import { Account, ID, TablesDB } from "node-appwrite";

import { DATABASE_ID, TABLES } from "@/lib/appwrite/config";
import { ownedRowPermissions } from "@/lib/appwrite/permissions";
import { createAdminClient, createSessionClient } from "@/lib/appwrite/server";

/**
 * Creates a library item.
 *
 * The uploader is taken from the session, never from the request body, so a
 * member can only ever upload as themselves.
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

  const title = String(body.title ?? "").trim();
  if (!title) {
    return NextResponse.json({ error: "Give the item a title." }, { status: 400 });
  }

  const tags = Array.isArray(body.tags)
    ? (body.tags as string[]).map((tag) => String(tag).trim().toLowerCase()).filter(Boolean).slice(0, 12)
    : [];

  const subject = body.subjectId ? String(body.subjectId) : null;
  const searchText = [title, ...tags, subject ? String(body.subjectName ?? "") : ""]
    .join(" ")
    .toLowerCase()
    .slice(0, 4000);

  const tables = new TablesDB(createAdminClient());

  let row;
  try {
    row = await tables.createRow({
      databaseId: DATABASE_ID,
      tableId: TABLES.materials,
      rowId: ID.unique(),
      data: {
        title,
        description: body.description ? String(body.description) : null,
        type: String(body.type ?? "book"),
        subjectId: subject,
        exam: body.exam ? String(body.exam) : null,
        year: body.year ? Number(body.year) : null,
        tags,
        kind: String(body.kind ?? "link"),
        fileId: body.fileId ? String(body.fileId) : null,
        fileName: body.fileName ? String(body.fileName) : null,
        fileSize: body.fileSize ? Number(body.fileSize) : null,
        linkUrl: body.linkUrl ? String(body.linkUrl) : null,
        youtubeId: body.youtubeId ? String(body.youtubeId) : null,
        youtubeType: body.youtubeType ? String(body.youtubeType) : null,
        youtubeTitle: body.youtubeTitle ? String(body.youtubeTitle) : null,
        uploaderId: userId,
        searchText,
        createdAt: new Date().toISOString(),
      },
      permissions: ownedRowPermissions(userId),
    });
  } catch (error: any) {
    console.error("Failed to create material row:", error);
    if (error.message?.includes("Connect Timeout Error") || error.code === "UND_ERR_CONNECT_TIMEOUT") {
      return NextResponse.json(
        { error: "Connection timeout - check your network and DNS configuration. Try flushing DNS cache." },
        { status: 503 }
      );
    }
    throw error;
  }

  return NextResponse.json({ ok: true, material: row });
}
