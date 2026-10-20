import { notFound } from "next/navigation";
import { Account, Query, TablesDB } from "node-appwrite";

import { PageContainer } from "@/components/layout/page-header";
import { MaterialDetail } from "@/components/library/material-detail";
import { DATABASE_ID, TABLES } from "@/lib/appwrite/config";
import { getMaterial, listChannels, listProfiles, listSubjects } from "@/lib/appwrite/data";
import type { DataClient } from "@/lib/appwrite/data";
import { createAdminClient, createSessionClient } from "@/lib/appwrite/server";
import type { Channel, Profile, Subject } from "@/types/appwrite";

export const metadata = { title: "Material" };
export const dynamic = "force-dynamic";

export default async function MaterialPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const sessionClient = await createSessionClient();
  const account = new Account(sessionClient);

  let userId = "";
  let email: string | null = null;
  try {
    const user = await account.get();
    userId = user.$id;
    email = user.email ?? null;
  } catch {
    userId = "";
  }

  const admin = createAdminClient();
  const tables = new TablesDB(admin);
  const client = { tablesDB: tables } as unknown as DataClient;

  const material = await getMaterial(client, id).catch(() => null);
  if (!material) notFound();

  const [subjects, channels, profiles] = await Promise.all([
    listSubjects(client).catch(() => [] as Subject[]),
    listChannels(client).catch(() => [] as Channel[]),
    listProfiles(client).catch(() => [] as Profile[]),
  ]);

  const profile =
    profiles.find((row) => row.userId === userId) ??
    ({
      $id: userId,
      userId,
      name: "Member",
      avatarColor: "#4F7CFF",
      exam: null,
      isAdmin: false,
      removed: false,
      createdAt: new Date().toISOString(),
    } satisfies Profile);

  const saved = await (async () => {
    try {
      const { rows } = await tables.listRows({
        databaseId: DATABASE_ID,
        tableId: TABLES.savedMaterials,
        queries: [Query.equal("userId", userId), Query.equal("materialId", id)],
      });
      return rows.length > 0;
    } catch {
      return false;
    }
  })();

  return (
    <PageContainer>
      <MaterialDetail
        material={material}
        subjects={subjects}
        channels={channels}
        currentUser={{ ...profile, email }}
        saved={saved}
      />
    </PageContainer>
  );
}
