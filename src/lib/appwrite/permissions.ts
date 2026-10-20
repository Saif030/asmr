import { Permission, Role } from "appwrite";

import { ADMIN_TEAM_ID } from "./config";

/**
 * Appwrite permission strings.
 *
 * The access model mirrors the row-level rules the project started with:
 *  - every member can read the shared tables
 *  - every member can create rows
 *  - a row's owner can update or delete it
 *  - members of the "admins" team can update or delete *any* row
 */
export const permissions = {
  /** Any signed-in member. */
  members: () => Permission.read(Role.users()),

  /** Anyone, including guests — used for the single public storage bucket. */
  anyone: () => Permission.read(Role.any()),

  create: () => Permission.create(Role.users()),

  /** Admins may change or remove any row. */
  adminsWrite: () => [
    Permission.update(Role.team(ADMIN_TEAM_ID)),
    Permission.delete(Role.team(ADMIN_TEAM_ID)),
  ],

  /** The owner of a row. */
  owner(userId: string) {
    return [
      Permission.update(Role.user(userId)),
      Permission.delete(Role.user(userId)),
    ];
  },
} as const;

/** Permissions written on a freshly created, member-owned row. */
export function ownedRowPermissions(userId: string): string[] {
  return [
    Permission.read(Role.users()),
    Permission.update(Role.user(userId)),
    Permission.delete(Role.user(userId)),
    Permission.update(Role.team(ADMIN_TEAM_ID)),
    Permission.delete(Role.team(ADMIN_TEAM_ID)),
  ];
}

/** Permissions for a personal row that only its owner may ever see. */
export function privateRowPermissions(userId: string): string[] {
  return [
    Permission.read(Role.user(userId)),
    Permission.update(Role.user(userId)),
    Permission.delete(Role.user(userId)),
  ];
}
