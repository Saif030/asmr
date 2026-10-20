import { redirect } from "next/navigation";
import { Account, Teams } from "node-appwrite";

import { PageContainer, PageHeader } from "@/components/layout/page-header";
import { AdminView } from "@/components/admin/admin-view";
import { ContentManager } from "@/components/admin/content-manager";
import { SubjectManager } from "@/components/admin/subject-manager";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ADMIN_TEAM_ID } from "@/lib/appwrite/config";
import { createAdminClient, createSessionClient } from "@/lib/appwrite/server";
import { serverEnv } from "@/lib/env";

export const metadata = { title: "Admin" };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const sessionClient = await createSessionClient();
  const account = new Account(sessionClient);

  let userId: string;
  try {
    const user = await account.get();
    userId = user.$id;
  } catch {
    redirect("/login");
  }

  // Admin restriction removed - any logged-in user can access admin page

  const { appUrl } = serverEnv();

  return (
    <PageContainer>
      <PageHeader
        title="Admin"
        description="Storage, activity and the health of this free-tier deployment."
      />
      <div className="mt-6 space-y-6">
        <AdminView keepaliveUrl={appUrl ? `${appUrl}/api/keepalive` : ""} />

        <Card>
          <CardHeader>
            <CardTitle>Subject Management</CardTitle>
            <CardDescription>
              Add, edit, or delete subjects for organizing library materials.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SubjectManager />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Content moderation</CardTitle>
            <CardDescription>
              Admins can remove anything a member shared. Stored files are deleted with
              the item.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ContentManager />
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
