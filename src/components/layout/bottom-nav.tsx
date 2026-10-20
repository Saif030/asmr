"use client";

import Link from "next/link";

import { ADMIN_NAV_ITEM, NAV_ITEMS, NavLink } from "@/components/layout/nav-items";
import { UserMenu } from "@/components/layout/user-menu";
import { Wordmark } from "@/components/layout/wordmark";
import type { Profile } from "@/types/appwrite";

/** Bottom tab bar shown on small screens. */
export function BottomNav({ profile }: { profile: Profile }) {
  const items = profile.isAdmin
    ? [...NAV_ITEMS.slice(0, 4), ADMIN_NAV_ITEM]
    : NAV_ITEMS.slice(0, 4);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur lg:hidden">
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-2 pb-[env(safe-area-inset-bottom)]">
        {items.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            orientation="vertical"
            className="flex-1"
          />
        ))}
      </div>
    </nav>
  );
}

/** Compact header shown on mobile instead of the sidebar. */
export function MobileTopbar({ profile }: { profile: Profile }) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/95 px-4 py-3 backdrop-blur lg:hidden">
      <Link href="/home" aria-label="Khatmal Coaching home">
        <Wordmark />
      </Link>
      <div className="flex items-center gap-2">
        {profile.isAdmin && (
          <NavLink item={ADMIN_NAV_ITEM} showLabel={false} className="p-2" />
        )}
        {/* The user menu reaches Members, the profile editor and the admin area. */}
        <UserMenu profile={profile} compact />
      </div>
    </header>
  );
}
