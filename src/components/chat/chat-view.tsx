"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Channel as RealtimeChannel, Query } from "appwrite";
import { Hash, MessagesSquare } from "lucide-react";

import { ChannelList } from "@/components/chat/channel-list";
import { Composer } from "@/components/chat/composer";
import { MessageBubble } from "@/components/chat/message-bubble";
import { ImageLightbox } from "@/components/library/previews";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppwrite } from "@/lib/appwrite/client";
import { BUCKETS, DATABASE_ID, TABLES } from "@/lib/appwrite/config";
import {
  listChannelReads,
  listMessages,
  listMaterials,
  listProfiles,
  latestMessagePerChannel,
} from "@/lib/appwrite/data";
import { chatImageUrl } from "@/lib/appwrite/files";
import type { DataClient } from "@/lib/appwrite/data";
import type { Channel, MessageWithRelations, Profile } from "@/types/appwrite";

const PAGE_SIZE = 50;

export function ChatView({
  channels,
  currentUser,
  initialChannelId,
}: {
  channels: Channel[];
  currentUser: Profile;
  initialChannelId?: string;
}) {
  const router = useRouter();
  const { client, tablesDB, storage, ready } = useAppwrite();
  const [activeChannel, setActiveChannel] = React.useState<Channel | null>(
    channels.find((channel) => channel.$id === initialChannelId) ?? channels[0] ?? null,
  );
  const [messages, setMessages] = React.useState<MessageWithRelations[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [loadingOlder, setLoadingOlder] = React.useState(false);
  const [hasOlder, setHasOlder] = React.useState(true);
  const [unread, setUnread] = React.useState<Set<string>>(new Set());
  const [lightbox, setLightbox] = React.useState<{ urls: string[]; index: number } | null>(null);

  const bottomRef = React.useRef<HTMLDivElement>(null);
  const activeChannelRef = React.useRef<string | null>(activeChannel?.$id ?? null);
  const atBottomRef = React.useRef(true);
  const dataClient = React.useMemo(() => ({ tablesDB }) as unknown as DataClient, [tablesDB]);

  React.useEffect(() => {
    activeChannelRef.current = activeChannel?.$id ?? null;
  }, [activeChannel]);

  // ---------------------------------------------------------------------
  // Unread state
  // ---------------------------------------------------------------------
  const loadUnread = React.useCallback(async () => {
    try {
      const [reads, latest] = await Promise.all([
        listChannelReads(dataClient, currentUser.userId),
        latestMessagePerChannel(dataClient),
      ]);

      const readMap = new Map(reads.map((row) => [row.channelId, new Date(row.lastReadAt).getTime()]));
      const next = new Set<string>();

      latest.forEach((value, channelId) => {
        const lastRead = readMap.get(channelId) ?? 0;
        if (new Date(value.at).getTime() > lastRead) next.add(channelId);
      });

      setUnread(next);
    } catch {
      // Unread dots are a nicety — never block the chat on them.
    }
  }, [dataClient, currentUser.userId]);

  const markRead = React.useCallback(
    async (channelId: string) => {
      setUnread((prev) => {
        const next = new Set(prev);
        next.delete(channelId);
        return next;
      });
      await fetch("/api/chat/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelId }),
      }).catch(() => null);
    },
    [],
  );

  React.useEffect(() => {
    if (ready) void loadUnread();
  }, [ready, loadUnread]);

  // ---------------------------------------------------------------------
  // Message loading
  // ---------------------------------------------------------------------
  const loadMessages = React.useCallback(
    async (channelId: string) => {
      const rows = await listMessages(dataClient, channelId, PAGE_SIZE);
      setMessages(rows);
      setHasOlder(rows.length === PAGE_SIZE);
      setLoading(false);
    },
    [dataClient],
  );

  React.useEffect(() => {
    if (!activeChannel || !ready) return;
    setLoading(true);
    void loadMessages(activeChannel.$id).catch((error) => {
      toast.error(String((error as Error)?.message ?? "Could not load the messages."));
      setLoading(false);
    });
    void markRead(activeChannel.$id);
    router.replace(`/chat/${activeChannel.$id}`);
  }, [activeChannel?.$id, ready, loadMessages, markRead, router]);

  const loadOlder = React.useCallback(async () => {
    if (!activeChannel || loadingOlder || !hasOlder) return;
    const oldest = messages[0];
    if (!oldest) return;

    setLoadingOlder(true);
    try {
      const { rows: older } = await tablesDB.listRows({
        databaseId: DATABASE_ID,
        tableId: TABLES.messages,
        queries: [
          Query.equal("channelId", activeChannel.$id),
          Query.orderDesc("createdAt"),
          Query.cursorAfter(oldest.$id),
          Query.limit(PAGE_SIZE),
        ],
      });

      const [profiles, materials] = await Promise.all([
        listProfiles(dataClient),
        listMaterials(dataClient),
      ]);
      const profileMap = new Map(profiles.map((profile) => [profile.userId, profile]));
      const materialMap = new Map(materials.map((material) => [material.$id, material]));

      const hydrated = (older as unknown as MessageWithRelations[]).map((message) => ({
        ...message,
        author: profileMap.get(message.userId) ?? null,
        material: message.materialId
          ? (() => {
              const material = materialMap.get(message.materialId);
              return material
                ? { $id: material.$id, title: material.title, type: material.type }
                : null;
            })()
          : null,
      }));

      setMessages((prev) => [...hydrated.reverse(), ...prev]);
      setHasOlder(older.length === PAGE_SIZE);
    } catch {
      // Older messages are optional — ignore a failed page.
    } finally {
      setLoadingOlder(false);
    }
  }, [activeChannel, loadingOlder, hasOlder, messages, client, dataClient]);

  // ---------------------------------------------------------------------
  // Realtime
  // ---------------------------------------------------------------------
  React.useEffect(() => {
    if (!ready) return;

    const channel = RealtimeChannel.tablesdb(DATABASE_ID).table(TABLES.messages).row();

    const unsubscribe = client.subscribe(channel, (event) => {
      const raw = (event.payload ?? {}) as Record<string, unknown>;
      const created = (raw.payload ?? raw) as Partial<MessageWithRelations> & {
        $id?: string;
        channelId?: string;
        userId?: string;
      };

      if (!created.$id || !created.channelId) return;

      const message: MessageWithRelations = {
        $id: created.$id,
        channelId: created.channelId,
        userId: created.userId ?? currentUser.userId,
        body: created.body ?? null,
        fileId: created.fileId ?? null,
        materialId: created.materialId ?? null,
        createdAt: created.createdAt ?? new Date().toISOString(),
        author: null,
        material: null,
      };

      if (message.channelId === activeChannelRef.current) {
        setMessages((prev) =>
          prev.some((item) => item.$id === message.$id) ? prev : [...prev, message],
        );
        if (atBottomRef.current) {
          requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }));
        }
        void markRead(message.channelId);
      } else {
        setUnread((prev) => new Set(prev).add(message.channelId));
      }
    });

    return () => unsubscribe();
  }, [ready, client, currentUser.userId, markRead]);

  // Keep the read marker fresh when the tab regains focus.
  React.useEffect(() => {
    function onFocus() {
      if (activeChannelRef.current) void markRead(activeChannelRef.current);
    }
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [markRead]);

  // ---------------------------------------------------------------------
  // Scrolling
  // ---------------------------------------------------------------------
  function onScroll(event: React.UIEvent<HTMLDivElement>) {
    const element = event.currentTarget;
    const distanceFromBottom = element.scrollHeight - element.scrollTop - element.clientHeight;
    atBottomRef.current = distanceFromBottom < 120;

    if (element.scrollTop < 80) {
      void loadOlder();
    }
  }

  React.useEffect(() => {
    if (loading) return;
    requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ block: "end" }));
  }, [activeChannel?.$id, loading]);

  const imageUrls = React.useMemo(
    () =>
      messages
        .filter((message) => message.fileId)
        .map((message) => chatImageUrl(message.fileId))
        .filter((url): url is string => Boolean(url)),
    [messages],
  );

  if (!channels.length) {
    return (
      <EmptyState
        icon={<MessagesSquare className="h-5 w-5" />}
        title="No channels yet"
        description="Create a channel to start talking with your group."
      />
    );
  }

  return (
    // Height accounts for the mobile top bar and the bottom tab bar.
    <div className="flex h-[calc(100dvh-9.5rem)] flex-col lg:h-dvh">
      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-64 shrink-0 overflow-y-auto border-r border-border bg-background lg:block">
          <ChannelList
            channels={channels}
            activeChannelId={activeChannel?.$id}
            unreadChannels={unread}
            onSelect={setActiveChannel}
          />
        </aside>

        <section className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center gap-3 border-b border-border px-4 py-3">
            <Hash className="hidden h-4 w-4 text-foreground-subtle lg:block" />
            <h2 className="hidden truncate text-sm font-semibold text-foreground lg:block">
              {activeChannel?.name}
            </h2>

            {/* On small screens the switcher replaces the title. */}
            <div className="flex-1 lg:hidden">
              <Select
                value={activeChannel?.$id}
                onValueChange={(value) => {
                  const channel = channels.find((item) => item.$id === value);
                  if (channel) setActiveChannel(channel);
                }}
              >
                <SelectTrigger className="h-9 w-full text-sm">
                  <SelectValue placeholder="Pick a channel" />
                </SelectTrigger>
                <SelectContent>
                  {channels.map((channel) => (
                    <SelectItem key={channel.$id} value={channel.$id}>
                      #{channel.name}
                      {unread.has(channel.$id) ? "  •" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </header>

          <div
            onScroll={onScroll}
            className="min-h-0 flex-1 overflow-y-auto bg-background py-3"
          >
            {loading ? (
              <div className="space-y-4 px-4">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="flex gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-3 w-32" />
                      <Skeleton className="h-10 w-56" />
                    </div>
                  </div>
                ))}
              </div>
            ) : messages.length === 0 ? (
              <EmptyState
                className="mx-4 mt-8"
                icon={<MessagesSquare className="h-5 w-5" />}
                title={`Say hello in #${activeChannel?.name}`}
                description="No messages here yet. Start the conversation."
              />
            ) : (
              <>
                {loadingOlder && (
                  <p className="px-4 pb-2 text-center text-xs text-foreground-subtle">
                    Loading older messages…
                  </p>
                )}
                {!hasOlder && messages.length > 0 && (
                  <p className="px-4 pb-2 text-center text-xs text-foreground-subtle">
                    This is the beginning of #{activeChannel?.name}
                  </p>
                )}
                {messages.map((message) => (
                  <MessageBubble
                    key={message.$id}
                    message={message}
                    isOwn={message.userId === currentUser.userId}
                    canManage={message.userId === currentUser.userId || currentUser.isAdmin}
                    onDelete={async (target) => {
                      try {
                        await tablesDB.deleteRow({
                          databaseId: DATABASE_ID,
                          tableId: TABLES.messages,
                          rowId: target.$id,
                        });
                        if (target.fileId) {
                          await storage
                            .deleteFile({ bucketId: BUCKETS.chat, fileId: target.fileId })
                            .catch(() => undefined);
                        }
                        setMessages((prev) => prev.filter((item) => item.$id !== target.$id));
                        toast.success("Message deleted.");
                      } catch (error) {
                        toast.error(String((error as Error)?.message ?? "Could not delete it."));
                      }
                    }}
                    onOpenImage={(url) => {
                      const index = imageUrls.indexOf(url);
                      setLightbox({ urls: imageUrls, index: index >= 0 ? index : 0 });
                    }}
                  />
                ))}
              </>
            )}
            <div ref={bottomRef} />
          </div>

          <Composer
            channelId={activeChannel?.$id ?? ""}
            userId={currentUser.userId}
            disabled={!activeChannel}
            onSent={() => {
              requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }));
            }}
          />
        </section>
      </div>

      {lightbox && (
        <ImageLightbox
          images={lightbox.urls}
          index={lightbox.index}
          onClose={() => setLightbox(null)}
          onIndexChange={(index) => setLightbox((prev) => (prev ? { ...prev, index } : prev))}
        />
      )}
    </div>
  );
}
