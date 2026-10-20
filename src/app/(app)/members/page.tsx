import { Account, TablesDB } from "node-appwrite";

import { PageContainer, PageHeader } from "@/components/layout/page-header";
import { MembersView } from "@/components/members/members-view";
import { listProfiles } from "@/lib/appwrite/data";
import type { DataClient } from "@/lib/appwrite/data";
import { createAdminClient, createSessionClient } from "@/lib/appwrite/server";
import type { Profile } from "@/types/appwrite";

export const metadata = { title: "Members" };
export const dynamic = "force-dynamic";

export default async function MembersPage() {
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

  const members = await listProfiles(client).catch(() => [] as Profile[]);

  const profile =
    members.find((row) => row.userId === userId) ??
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
        title="Members"
        description={`${members.length} ${members.length === 1 ? "person" : "people"} in the hub.`}
      />
      <div className="mt-6">
        <MembersView members={members} currentUser={{ ...profile, email }} />
      </div>
    </PageContainer>
  );
}
