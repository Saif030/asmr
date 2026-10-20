"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bookmark,
  Home,
  Library,
  MessagesSquare,
  Settings,
  Users,
} from "lucide-react";

import { cn } from "@/lib/utils";

export type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/library", label: "Library", icon: Library },
  { href: "/chat", label: "Chat", icon: MessagesSquare },
  { href: "/saved", label: "Saved", icon: Bookmark },
  { href: "/members", label: "Members", icon: Users },
];

export const ADMIN_NAV_ITEM: NavItem = {
  href: "/admin",
  label: "Admin",
  icon: Settings,
  adminOnly: true,
};

/** Highlights the nav entry that matches the current route. */
export function useIsActive(href: string) {
  const pathname = usePathname();
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function NavLink({
  item,
  className,
  orientation = "horizontal",
  showLabel = true,
  onClick,
}: {
  item: NavItem;
  className?: string;
  orientation?: "horizontal" | "vertical";
  showLabel?: boolean;
  onClick?: () => void;
}) {
  const active = useIsActive(item.href);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        "flex rounded-xl text-sm font-medium transition-colors",
        orientation === "vertical"
          ? "flex-col items-center gap-1 px-1 py-2.5 text-[11px]"
          : "items-center gap-3 px-3 py-2",
        active
          ? "bg-accent-soft text-accent"
          : "text-foreground-muted hover:bg-surface hover:text-foreground",
        className,
      )}
    >
      <Icon className={cn("shrink-0", orientation === "vertical" ? "h-5 w-5" : "h-[18px] w-[18px]")} />
      {showLabel && <span className="truncate">{item.label}</span>}
    </Link>
  );
}
