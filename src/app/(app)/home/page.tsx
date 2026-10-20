import Link from "next/link";
import { Account, Query, TablesDB } from "node-appwrite";
import {
  ArrowRight,
  Bookmark,
  FileText,
  ImageIcon,
  Link2,
  MessagesSquare,
  Youtube,
} from "lucide-react";

import { PageContainer, PageHeader } from "@/components/layout/page-header";
import { SaveButton } from "@/components/library/save-button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { listMaterials, listProfiles } from "@/lib/appwrite/data";
import type { DataClient } from "@/lib/appwrite/data";
import { createAdminClient, createSessionClient } from "@/lib/appwrite/server";
import { MATERIAL_TYPE_LABELS } from "@/lib/constants/limits";
import { formatRelative, initialsFor } from "@/lib/utils";
import type { MaterialWithRelations } from "@/types/appwrite";

export const metadata = { title: "Home" };
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const sessionClient = await createSessionClient();
  const account = new Account(sessionClient);

  let userId = "";
  let name: string | null = null;
  try {
    const user = await account.get();
    userId = user.$id;
    name = user.name ?? null;
  } catch {
    userId = "";
  }

  const admin = createAdminClient();
  const tables = new TablesDB(admin);
  const client = { tablesDB: tables } as unknown as DataClient;

  const [materials, profiles, savedRows, messageRows] = await Promise.all([
    listMaterials(client, { sort: "newest", limit: 6 }).catch(() => [] as MaterialWithRelations[]),
    listProfiles(client).catch(() => []),
    client.tablesDB
      .listRows({
        databaseId: "khatmal",
        tableId: "saved_materials",
        queries: [Query.equal("userId", userId)],
      })
      .catch(() => ({ rows: [] as unknown[] })),
    client.tablesDB
      .listRows({
        databaseId: "khatmal",
        tableId: "messages",
        queries: [Query.orderDesc("createdAt"), Query.limit(6)],
      })
      .catch(() => ({ rows: [] as unknown[] })),
  ]);

  const savedIds = new Set(
    (savedRows.rows as unknown as { materialId: string }[]).map((row) => row.materialId),
  );
  const saved = materials.filter((material) => savedIds.has(material.$id)).slice(0, 4);

  const profileMap = new Map(profiles.map((profile) => [profile.userId, profile]));
  const activity = (
    messageRows.rows as unknown as {
      $id: string;
      body: string | null;
      createdAt: string;
      userId: string;
      channelId: string;
    }[]
  ).map((message) => ({
    ...message,
    author: profileMap.get(message.userId) ?? null,
  }));

  const firstName = (name ?? "friend").split(" ")[0];

  return (
    <PageContainer>
      <PageHeader
        title={`Welcome back, ${firstName}`}
        description="Here is what your study group has been up to."
        action={
          <Button asChild>
            <Link href="/library">
              Browse the library
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        }
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {/* Recently added ------------------------------------------------ */}
        <section className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Recently added</h2>
            <Link href="/library" className="text-xs font-medium text-accent hover:underline">
              View all
            </Link>
          </div>

          {materials.length === 0 ? (
            <EmptyState
              icon={<FileText className="h-5 w-5" />}
              title="Nothing shared yet"
              description="Add the first book or PYQ set for your group."
              action={
                <Button asChild size="sm">
                  <Link href="/library">Open the library</Link>
                </Button>
              }
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {materials.map((material) => (
                <article
                  key={material.$id}
                  className="flex gap-3 rounded-2xl border border-border bg-background p-4 shadow-subtle"
                >
                  <Link
                    href={`/library/${material.$id}`}
                    className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-surface text-foreground-muted"
                  >
                    {material.kind === "youtube" ? (
                      <Youtube className="h-5 w-5" />
                    ) : material.kind === "link" ? (
                      <Link2 className="h-5 w-5" />
                    ) : material.type === "image" ? (
                      <ImageIcon className="h-5 w-5" />
                    ) : (
                      <FileText className="h-5 w-5" />
                    )}
                  </Link>

                  <div className="min-w-0 flex-1">
                    <Link href={`/library/${material.$id}`}>
                      <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-foreground hover:text-accent">
                        {material.title}
                      </h3>
                    </Link>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <Badge variant="outline">
                        {MATERIAL_TYPE_LABELS[material.type] ?? material.type}
                      </Badge>
                      {material.subject && <Badge variant="solid">{material.subject.name}</Badge>}
                    </div>
                    <p className="mt-1.5 text-xs text-foreground-subtle">
                      {material.uploader?.name ?? "Unknown"} ·{" "}
                      {formatRelative(material.createdAt)}
                    </p>
                  </div>

                  <SaveButton materialId={material.$id} initialSaved={savedIds.has(material.$id)} />
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Right column -------------------------------------------------- */}
        <div className="space-y-6">
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">My saved</h2>
              <Link href="/saved" className="text-xs font-medium text-accent hover:underline">
                View all
              </Link>
            </div>

            {saved.length === 0 ? (
              <EmptyState
                icon={<Bookmark className="h-5 w-5" />}
                title="Nothing saved"
                description="Bookmark an item to keep it handy."
              />
            ) : (
              <div className="space-y-2">
                {saved.map((material) => (
                  <Link
                    key={material.$id}
                    href={`/library/${material.$id}`}
                    className="block rounded-2xl border border-border bg-background p-3 shadow-subtle transition-colors hover:bg-surface"
                  >
                    <p className="line-clamp-2 text-sm font-medium text-foreground">
                      {material.title}
                    </p>
                    <p className="mt-0.5 text-xs text-foreground-subtle">
                      {MATERIAL_TYPE_LABELS[material.type] ?? material.type}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">Latest chat</h2>
              <Link href="/chat" className="text-xs font-medium text-accent hover:underline">
                Open chat
              </Link>
            </div>

            {activity.length === 0 ? (
              <EmptyState
                icon={<MessagesSquare className="h-5 w-5" />}
                title="No messages yet"
                description="Say something to your group."
              />
            ) : (
              <div className="space-y-3">
                {activity.map((message) => (
                  <Link
                    key={message.$id}
                    href={`/chat/${message.channelId}`}
                    className="flex gap-2.5 rounded-xl px-1 py-1 transition-colors hover:bg-surface"
                  >
                    <Avatar className="h-7 w-7 shrink-0">
                      <AvatarFallback
                        style={{
                          backgroundColor: `${message.author?.avatarColor ?? "#4F7CFF"}1A`,
                          color: message.author?.avatarColor ?? "#4F7CFF",
                          fontSize: "10px",
                        }}
                      >
                        {initialsFor(message.author?.name ?? "?")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-xs text-foreground">
                        <span className="font-semibold">{message.author?.name ?? "Unknown"}</span>
                      </p>
                      <p className="line-clamp-2 text-xs text-foreground-muted">
                        {message.body ?? "Shared an attachment"}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </PageContainer>
  );
}
