import { Account } from "node-appwrite";

import { PageContainer, PageHeader } from "@/components/layout/page-header";
import { SavedView } from "@/components/saved/saved-view";
import { createSessionClient } from "@/lib/appwrite/server";

export const metadata = { title: "Saved" };
export const dynamic = "force-dynamic";

export default async function SavedPage() {
  const sessionClient = await createSessionClient();
  const account = new Account(sessionClient);

  let userId = "";
  try {
    const user = await account.get();
    userId = user.$id;
  } catch {
    userId = "";
  }

  return (
    <PageContainer>
      <PageHeader
        title="Saved"
        description="Your personal shortlist of material worth revisiting."
      />
      <div className="mt-6">
        <SavedView userId={userId} />
      </div>
    </PageContainer>
  );
}
