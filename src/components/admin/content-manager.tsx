"use client";

import * as React from "react";
import { Query } from "appwrite";
import Link from "next/link";
import { toast } from "sonner";
import { FileText, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppwrite } from "@/lib/appwrite/client";
import { DATABASE_ID, TABLES } from "@/lib/appwrite/config";
import { listMaterials } from "@/lib/appwrite/data";
import type { DataClient } from "@/lib/appwrite/data";
import { formatRelative } from "@/lib/utils";
import type { MaterialWithRelations } from "@/types/appwrite";

type MessageRow = {
  $id: string;
  body: string | null;
  createdAt: string;
  userId: string;
  authorName: string;
  channelName: string;
};

/**
 * Admin content moderation: delete anything a member uploaded.
 * The stored file is removed alongside the row.
 */
export function ContentManager() {
  const { tablesDB, storage, ready } = useAppwrite();
  const [materials, setMaterials] = React.useState<MaterialWithRelations[]>([]);
  const [messages, setMessages] = React.useState<MessageRow[]>([]);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    if (!ready) return;
    const client = { tablesDB } as unknown as DataClient;

    try {
      const [materialRows, messageRows, profiles] = await Promise.all([
        listMaterials(client, { sort: "newest", limit: 10 }),
        client.tablesDB.listRows({
          databaseId: DATABASE_ID,
          tableId: TABLES.messages,
          queries: [Query.orderDesc("createdAt"), Query.limit(10)],
        }),
        client.tablesDB.listRows({
          databaseId: DATABASE_ID,
          tableId: TABLES.profiles,
          queries: [Query.limit(100)],
        }),
      ]);

      setMaterials(materialRows);

      const profileMap = new Map(
        (profiles.rows as unknown as { userId: string; name: string }[]).map((profile) => [
          profile.userId,
          profile.name,
        ]),
      );

      setMessages(
        (messageRows.rows as unknown as MessageRow[]).map((message) => ({
          ...message,
          authorName: profileMap.get(message.userId) ?? "Unknown",
          channelName: "",
        })),
      );
    } catch {
      // The moderation list is best-effort.
    } finally {
      setLoading(false);
    }
  }, [ready, tablesDB]);

  React.useEffect(() => {
    void load();
  }, [load]);

  async function deleteMaterial(material: MaterialWithRelations) {
    try {
      await tablesDB.deleteRow({
        databaseId: DATABASE_ID,
        tableId: TABLES.materials,
        rowId: material.$id,
      });
      if (material.fileId) {
        await storage
          .deleteFile({ bucketId: "materials", fileId: material.fileId })
          .catch(() => undefined);
      }
      toast.success("Item deleted.");
      void load();
    } catch (error) {
      toast.error(String((error as Error)?.message ?? "Could not delete that item."));
    }
  }

  async function deleteMessage(id: string) {
    try {
      await tablesDB.deleteRow({
        databaseId: DATABASE_ID,
        tableId: TABLES.messages,
        rowId: id,
      });
      toast.success("Message deleted.");
      void load();
    } catch (error) {
      toast.error(String((error as Error)?.message ?? "Could not delete that message."));
    }
  }

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  const empty = materials.length === 0 && messages.length === 0;

  return (
    <div className="space-y-6">
      {empty ? (
        <EmptyState
          icon={<FileText className="h-5 w-5" />}
          title="No content yet"
          description="Library items and messages will appear here for moderation."
        />
      ) : null}

      {materials.length > 0 && (
        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-foreground-subtle">
            Latest library items
          </h3>
          <div className="space-y-2">
            {materials.map((material) => (
              <div
                key={material.$id}
                className="flex items-center gap-3 rounded-xl border border-border px-3 py-2.5"
              >
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/library/${material.$id}`}
                    className="block truncate text-sm font-medium text-foreground hover:text-accent"
                  >
                    {material.title}
                  </Link>
                  <p className="truncate text-xs text-foreground-subtle">
                    {material.uploader?.name ?? "Unknown"} ·{" "}
                    {formatRelative(material.createdAt)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Delete ${material.title}`}
                  className="text-danger"
                  onClick={() => deleteMaterial(material)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </section>
      )}

      {messages.length > 0 && (
        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-foreground-subtle">
            Latest messages
          </h3>
          <div className="space-y-2">
            {messages.map((message) => (
              <div
                key={message.$id}
                className="flex items-center gap-3 rounded-xl border border-border px-3 py-2.5"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-foreground">
                    {message.body ?? "(attachment)"}
                  </p>
                  <p className="truncate text-xs text-foreground-subtle">
                    {message.authorName} · {formatRelative(message.createdAt)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Delete message"
                  className="text-danger"
                  onClick={() => deleteMessage(message.$id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
