import { Account, TablesDB } from "node-appwrite";

import { PageContainer, PageHeader } from "@/components/layout/page-header";
import { LibraryView } from "@/components/library/library-view";
import { listProfiles, listSubjects } from "@/lib/appwrite/data";
import type { DataClient } from "@/lib/appwrite/data";
import { createAdminClient, createSessionClient } from "@/lib/appwrite/server";
import type { Profile, Subject } from "@/types/appwrite";

export const metadata = { title: "Library" };
export const dynamic = "force-dynamic";

export default async function LibraryPage() {
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

  const [subjects, profiles] = await Promise.all([
    listSubjects(client).catch(() => [] as Subject[]),
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

  return (
    <PageContainer>
      <PageHeader
        title="Library"
        description="Everything your group has shared — books, PYQs, question banks, notes and lectures."
      />
      <div className="mt-6">
        <LibraryView subjects={subjects} currentUser={{ ...profile, email }} />
      </div>
    </PageContainer>
  );
}
