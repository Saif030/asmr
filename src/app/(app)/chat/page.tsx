import { redirect } from "next/navigation";
import { Account, TablesDB } from "node-appwrite";

import { ChatView } from "@/components/chat/chat-view";
import { listChannels, listProfiles } from "@/lib/appwrite/data";
import type { DataClient } from "@/lib/appwrite/data";
import { createAdminClient, createSessionClient } from "@/lib/appwrite/server";
import type { Channel, Profile } from "@/types/appwrite";

export const metadata = { title: "Chat" };
export const dynamic = "force-dynamic";

export default async function ChatPage() {
  const sessionClient = await createSessionClient();
  const account = new Account(sessionClient);

  let userId = "";
  let email: string | null = null;
  try {
    const user = await account.get();
    userId = user.$id;
    email = user.email ?? null;
  } catch {
    redirect("/login");
  }

  const admin = createAdminClient();
  const tables = new TablesDB(admin);
  const client = { tablesDB: tables } as unknown as DataClient;

  const [channels, profiles] = await Promise.all([
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

  return <ChatView channels={channels} currentUser={{ ...profile, email }} />;
}
