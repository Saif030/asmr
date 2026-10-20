import { redirect } from "next/navigation";
import { Account } from "node-appwrite";

import { createSessionClient } from "@/lib/appwrite/server";

export const dynamic = "force-dynamic";

export default async function RootPage() {
  const client = await createSessionClient();
  const account = new Account(client);

  let signedIn = false;
  try {
    await account.get();
    signedIn = true;
  } catch {
    signedIn = false;
  }

  redirect(signedIn ? "/home" : "/login");
}
