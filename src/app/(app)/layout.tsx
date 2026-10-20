import { redirect } from "next/navigation";
import { Account, Query, TablesDB, Teams } from "node-appwrite";

import { AppShell } from "@/components/layout/app-shell";
import {
  ADMIN_TEAM_ID,
  DATABASE_ID,
  TABLES,
} from "@/lib/appwrite/config";
import { createAdminClient, createSessionClient } from "@/lib/appwrite/server";
import { avatarColorFor } from "@/lib/utils";
import type { Profile } from "@/types/appwrite";

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sessionClient = await createSessionClient();
  const account = new Account(sessionClient);

  let userId: string;
  let email: string | null = null;
  let name: string | null = null;

  try {
    const user = await account.get();
    userId = user.$id;
    email = user.email ?? null;
    name = user.name ?? null;
  } catch {
    redirect("/login");
  }

  const admin = createAdminClient();
  const tables = new TablesDB(admin);

  const { rows } = await tables.listRows({
    databaseId: DATABASE_ID,
    tableId: TABLES.profiles,
    queries: [Query.equal("userId", userId), Query.limit(1)],
  });

  let profileRow = rows[0] as unknown as Profile | undefined;

  // A member removed by an admin must not keep browsing the hub.
  if (profileRow?.removed) {
    redirect("/login");
  }

  // Self-heal: a profile always exists, even if signup was interrupted.
  if (!profileRow) {
    const created = await tables.createRow({
      databaseId: DATABASE_ID,
      tableId: TABLES.profiles,
      rowId: `${userId}`,
      data: {
        userId,
        name: name ?? email?.split("@")[0] ?? "Member",
        avatarColor: avatarColorFor(userId),
        exam: null,
        isAdmin: false,
        removed: false,
        createdAt: new Date().toISOString(),
      },
    });
    profileRow = created as unknown as Profile;
  }

  // Admin rights come from membership of the "admins" team.
  let isAdmin = Boolean(profileRow.isAdmin);
  try {
    const teams = new Teams(admin);
    await teams.getMembership(ADMIN_TEAM_ID, userId);
    isAdmin = true;
  } catch {
    isAdmin = Boolean(profileRow.isAdmin);
  }

  const profile: Profile = {
    $id: profileRow.$id,
    userId: profileRow.userId ?? userId,
    name: profileRow.name ?? name ?? "Member",
    avatarColor: profileRow.avatarColor ?? "#4F7CFF",
    exam: profileRow.exam ?? null,
    isAdmin,
    removed: Boolean(profileRow.removed),
    createdAt: profileRow.createdAt ?? new Date().toISOString(),
  };

  return <AppShell profile={{ ...profile, email }}>{children}</AppShell>;
}
