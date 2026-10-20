import { Query } from "appwrite";

import { DATABASE_ID, TABLES } from "./config";

/**
 * Query builders shared by the server and the browser.
 * Appwrite caps a page at 100 rows, so every list is explicitly limited.
 */

export type MaterialFilters = {
  search?: string;
  type?: string;
  subjectId?: string;
  year?: number | null;
  sort?: "newest" | "oldest" | "title";
  limit?: number;
};

export function materialQueries(filters: MaterialFilters = {}): string[] {
  const queries: string[] = [];

  const term = (filters.search ?? "").trim();
  if (term.length >= 2) {
    // Fulltext index over title + tags + subject.
    queries.push(Query.search("searchText", term));
  }
  if (filters.type && filters.type !== "all") {
    queries.push(Query.equal("type", filters.type));
  }
  if (filters.subjectId && filters.subjectId !== "all") {
    queries.push(Query.equal("subjectId", filters.subjectId));
  }
  if (filters.year) {
    queries.push(Query.equal("year", filters.year));
  }

  if (filters.sort === "oldest") queries.push(Query.orderAsc("createdAt"));
  else if (filters.sort === "title") queries.push(Query.orderAsc("title"));
  else queries.push(Query.orderDesc("createdAt"));

  queries.push(Query.limit(Math.min(filters.limit ?? 100, 100)));
  return queries;
}

export function messageQueries(channelId: string, limit: number, cursor?: string): string[] {
  const queries: string[] = [Query.equal("channelId", channelId), Query.orderDesc("createdAt")];
  if (cursor) queries.push(Query.cursorAfter(cursor));
  queries.push(Query.limit(Math.min(limit, 100)));
  return queries;
}

export function savedMaterialQueries(userId: string): string[] {
  return [Query.equal("userId", userId), Query.orderDesc("createdAt"), Query.limit(100)];
}

export function channelReadQueries(userId: string): string[] {
  return [Query.equal("userId", userId), Query.limit(100)];
}

export function profileQueries(): string[] {
  return [Query.orderAsc("createdAt"), Query.limit(100)];
}

export function subjectQueries(): string[] {
  return [Query.orderAsc("name"), Query.limit(100)];
}

export function channelQueries(): string[] {
  return [Query.orderAsc("createdAt"), Query.limit(100)];
}

export { DATABASE_ID, TABLES };

/**
 * The text the fulltext index searches: title, tags and subject, lower-cased.
 * Kept in one place so the server (create) and the browser (update) build it
 * the same way.
 */
export function buildSearchText(
  title: string,
  tags: string[] = [],
  subjectName = "",
): string {
  return [title, ...tags, subjectName]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .slice(0, 4000);
}
