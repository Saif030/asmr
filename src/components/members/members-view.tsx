"use client";

import * as React from "react";
import { toast } from "sonner";
import { Check, Pencil, ShieldCheck, Trash2, UserMinus } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
import { useAppwrite } from "@/lib/appwrite/client";
import { DATABASE_ID, TABLES } from "@/lib/appwrite/config";
import { listProfiles } from "@/lib/appwrite/data";
import type { DataClient } from "@/lib/appwrite/data";
import { formatDate, initialsFor } from "@/lib/utils";
import type { Profile } from "@/types/appwrite";

export function MembersView({
  members,
  currentUser,
}: {
  members: Profile[];
  currentUser: Profile;
}) {
  const { tablesDB, ready } = useAppwrite();
  const [rows, setRows] = React.useState<Profile[]>(members);
  const [editing, setEditing] = React.useState<Profile | null>(null);
  const [name, setName] = React.useState("");
  const [exam, setExam] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [removing, setRemoving] = React.useState<Profile | null>(null);
  const [removingBusy, setRemovingBusy] = React.useState(false);

  React.useEffect(() => {
    setRows(members);
  }, [members]);

  React.useEffect(() => {
    if (!ready) return;
    void listProfiles({ tablesDB } as unknown as DataClient)
      .then((profiles) => setRows(profiles))
      .catch(() => undefined);
  }, [ready, tablesDB]);

  function startEdit(profile: Profile) {
    setEditing(profile);
    setName(profile.name);
    setExam(profile.exam ?? "");
  }

  async function saveProfile(event: React.FormEvent) {
    event.preventDefault();
    if (!editing) return;
    setSaving(true);

    try {
      await tablesDB.updateRow({
        databaseId: DATABASE_ID,
        tableId: TABLES.profiles,
        rowId: editing.$id,
        data: { name: name.trim() || editing.name, exam: exam.trim() || null },
      });
      toast.success("Profile updated.");
      setEditing(null);
    } catch (error) {
      toast.error(String((error as Error)?.message ?? "Could not update the profile."));
    } finally {
      setSaving(false);
    }
  }

  async function removeMember() {
    if (!removing) return;
    setRemovingBusy(true);

    const response = await fetch("/api/admin/members", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: removing.userId }),
    }).catch(() => null);

    if (!response?.ok) {
      const payload = response ? await response.json().catch(() => ({})) : {};
      toast.error(payload.error ?? "Could not remove that member.");
      setRemovingBusy(false);
      return;
    }

    toast.success(`${removing.name} was removed.`);
    setRemovingBusy(false);
    setRemoving(null);
    setRows((prev) => prev.filter((member) => member.userId !== removing.userId));
  }

  return (
    <div className="space-y-3">
      {rows.map((member) => {
        const isSelf = member.userId === currentUser.userId;
        const removed = Boolean(member.removed);

        return (
          <div
            key={member.$id}
            className="flex items-center gap-4 rounded-2xl border border-border bg-background p-4 shadow-subtle"
          >
            <Avatar className="h-11 w-11">
              <AvatarFallback
                style={{
                  backgroundColor: `${member.avatarColor}1A`,
                  color: member.avatarColor,
                }}
              >
                {initialsFor(member.name)}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate text-sm font-semibold text-foreground">{member.name}</p>
                {member.isAdmin && (
                  <Badge>
                    <ShieldCheck className="h-3 w-3" />
                    Admin
                  </Badge>
                )}
                {isSelf && <Badge variant="outline">You</Badge>}
                {removed && <Badge variant="danger">Removed</Badge>}
              </div>
              <p className="mt-0.5 truncate text-xs text-foreground-subtle">
                {member.exam || "No exam/class set"} · joined {formatDate(member.createdAt)}
              </p>
            </div>

            <div className="flex items-center gap-1">
              {isSelf && (
                <Button variant="ghost" size="sm" onClick={() => startEdit(member)}>
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </Button>
              )}
              {currentUser.isAdmin && !isSelf && !removed && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Remove ${member.name}`}
                  onClick={() => setRemoving(member)}
                  className="text-danger"
                >
                  <UserMinus className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        );
      })}

      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit your profile</DialogTitle>
            <DialogDescription>
              Your avatar is generated from your initials — no upload needed.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={saveProfile} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="profileName">Name</Label>
              <Input
                id="profileName"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="profileExam">Exam / class (optional)</Label>
              <Input
                id="profileExam"
                placeholder="JEE 2026, NEET…"
                value={exam}
                onChange={(e) => setExam(e.target.value)}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setEditing(null)}>
                Cancel
              </Button>
              <Button type="submit" loading={saving}>
                <Check className="h-4 w-4" />
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(removing)} onOpenChange={(open) => !open && setRemoving(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Remove {removing?.name}?</DialogTitle>
            <DialogDescription>
              Their account is deleted. Shared material stays in the library so the group
              does not lose it.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setRemoving(null)}>
              Cancel
            </Button>
            <Button variant="danger" loading={removingBusy} onClick={removeMember}>
              <Trash2 className="h-4 w-4" />
              Remove member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
