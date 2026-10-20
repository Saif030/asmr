"use client";

import type { Profile } from "@/types/appwrite";

import { BottomNav, MobileTopbar } from "@/components/layout/bottom-nav";
import { OfflineBanner } from "@/components/layout/offline-banner";
import { Sidebar } from "@/components/layout/sidebar";

/**
 * App chrome: persistent sidebar on desktop, compact top bar + bottom tabs on
 * mobile. Content is padded so the fixed mobile tab bar never covers it.
 */
export function AppShell({
  profile,
  children,
}: {
  profile: Profile;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh bg-background">
      <Sidebar profile={profile} />

      <div className="flex min-w-0 flex-1 flex-col">
        <MobileTopbar profile={profile} />
        <OfflineBanner />
        <main className="flex-1 pb-24 lg:pb-0">{children}</main>
      </div>

      <BottomNav profile={profile} />
    </div>
  );
}
