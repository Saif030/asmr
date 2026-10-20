"use client";

import Link from "next/link";

import { Wordmark } from "@/components/layout/wordmark";
import { ADMIN_NAV_ITEM, NAV_ITEMS, NavLink } from "@/components/layout/nav-items";
import { UserMenu } from "@/components/layout/user-menu";
import type { Profile } from "@/types/appwrite";

export function Sidebar({ profile }: { profile: Profile }) {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-border bg-background lg:flex lg:flex-col">
      <div className="px-5 py-6">
        <Link href="/home" aria-label="Khatmal Coaching home">
          <Wordmark />
        </Link>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}
        {profile.isAdmin && <NavLink item={ADMIN_NAV_ITEM} />}
      </nav>

      <div className="border-t border-border p-3">
        <UserMenu profile={profile} />
      </div>
    </aside>
  );
}
