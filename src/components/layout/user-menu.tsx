"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, ShieldCheck, User as UserIcon } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Profile } from "@/types/appwrite";
import { cn, initialsFor } from "@/lib/utils";

export function UserMenu({ profile, compact = false }: { profile: Profile; compact?: boolean }) {
  const router = useRouter();
  const [signingOut, setSigningOut] = React.useState(false);

  async function signOut() {
    setSigningOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex items-center rounded-xl text-left transition-colors hover:bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
            compact ? "p-1" : "w-full gap-3 px-2 py-2",
          )}
        >
          <Avatar className="h-9 w-9">
            <AvatarFallback
              style={{ backgroundColor: `${profile.avatarColor}1A`, color: profile.avatarColor }}
            >
              {initialsFor(profile.name)}
            </AvatarFallback>
          </Avatar>
          {!compact && (
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-foreground">
                {profile.name}
              </span>
              <span className="block truncate text-xs text-foreground-subtle">
                {profile.isAdmin ? "Admin" : profile.exam || "Member"}
              </span>
            </span>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>{profile.email ?? profile.name}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/members">
            <UserIcon />
            Profile
          </Link>
        </DropdownMenuItem>
        {profile.isAdmin && (
          <DropdownMenuItem asChild>
            <Link href="/admin">
              <ShieldCheck />
              Admin area
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem destructive onSelect={(e) => { e.preventDefault(); void signOut(); }}>
          <LogOut />
          {signingOut ? "Signing out…" : "Log out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
