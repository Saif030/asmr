"use client";

import * as React from "react";
import { toast } from "sonner";
import { Hash, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn, slugify } from "@/lib/utils";
import type { Channel } from "@/types/appwrite";

export function ChannelList({
  channels,
  activeChannelId,
  unreadChannels,
  onSelect,
}: {
  channels: Channel[];
  activeChannelId?: string;
  unreadChannels: Set<string>;
  onSelect: (channel: Channel) => void;
}) {
  const [createOpen, setCreateOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  async function createChannel(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;

    setBusy(true);

    try {
      const response = await fetch("/api/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed, slug: slugify(trimmed) }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        toast.error(payload.error ?? "Could not create that channel.");
        setBusy(false);
        return;
      }

      toast.success(`#${trimmed} created.`);
      setName("");
      setCreateOpen(false);
      setBusy(false);
      onSelect(payload.channel as Channel);
    } catch {
      toast.error("Network error — check your connection.");
      setBusy(false);
    }
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between px-3 pb-1 pt-4">
        <span className="text-xs font-semibold uppercase tracking-wide text-foreground-subtle">
          Channels
        </span>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Create channel"
          onClick={() => setCreateOpen(true)}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {channels.map((channel) => {
        const active = channel.$id === activeChannelId;
        const unread = unreadChannels.has(channel.$id) && !active;
        return (
          <button
            key={channel.$id}
            type="button"
            onClick={() => onSelect(channel)}
            className={cn(
              "flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-accent-soft text-accent"
                : "text-foreground-muted hover:bg-surface hover:text-foreground",
            )}
          >
            <Hash className="h-4 w-4 shrink-0" />
            <span className="min-w-0 flex-1 truncate text-left">{channel.name}</span>
            {unread && (
              <span className="h-2 w-2 shrink-0 rounded-full bg-accent" aria-label="Unread messages" />
            )}
          </button>
        );
      })}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>New channel</DialogTitle>
            <DialogDescription>
              Keep one channel per subject, or whatever your group prefers.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={createChannel} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="channelName">Channel name</Label>
              <Input
                id="channelName"
                required
                maxLength={40}
                placeholder="organic-chemistry"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={busy}>
                Create channel
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
