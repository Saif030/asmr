import { NextResponse } from "next/server";
import { Query, Storage } from "node-appwrite";
import { cookies } from "next/headers";

import { BUCKETS, sessionCookieName } from "@/lib/appwrite/config";
import { createAdminClient } from "@/lib/appwrite/server";
import {
  STORAGE_QUOTA_BYTES,
  STORAGE_UPLOAD_BLOCK_BYTES,
} from "@/lib/constants/limits";

export const dynamic = "force-dynamic";

/**
 * Current Storage usage for the admin panel and the pre-upload guard.
 * Reads the exact byte counts Appwrite reports for every file.
 */
export async function GET() {
  const cookieStore = await cookies();
  const session = cookieStore.get(sessionCookieName())?.value;

  if (!session) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const storage = new Storage(createAdminClient());

  async function bucketUsage(bucketId: string) {
    let bytes = 0;
    let count = 0;
    let cursor: string | undefined;

    // Files are listed in pages of 100; keep walking until the bucket is empty.
    for (let page = 0; page < 200; page++) {
      const queries = [Query.limit(100), Query.orderAsc("$id")];
      if (cursor) queries.push(Query.cursorAfter(cursor));

      const { files } = await storage.listFiles({ bucketId, queries });

      if (!files.length) break;

      for (const file of files) {
        bytes += Number(file.sizeOriginal ?? 0);
        count += 1;
      }

      if (files.length < 100) break;
      cursor = files[files.length - 1].$id;
    }

    return { bucketId, usedBytes: bytes, objectCount: count };
  }

  try {
    const materials = await bucketUsage(BUCKETS.materials);
    const chat = await bucketUsage(BUCKETS.chat);
    const totalBytes = materials.usedBytes + chat.usedBytes;

    return NextResponse.json({
      buckets: [materials, chat],
      totalBytes,
      limitBytes: STORAGE_QUOTA_BYTES,
      blockBytes: STORAGE_UPLOAD_BLOCK_BYTES,
      blocked: totalBytes >= STORAGE_UPLOAD_BLOCK_BYTES,
    });
  } catch (error) {
    return NextResponse.json(
      { error: `Could not read storage usage: ${String((error as Error)?.message)}` },
      { status: 500 },
    );
  }
}
