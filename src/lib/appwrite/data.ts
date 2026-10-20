import { Query } from "appwrite";

import { DATABASE_ID, TABLES } from "./config";
import {
  channelQueries,
  materialQueries,
  messageQueries,
  profileQueries,
  savedMaterialQueries,
  subjectQueries,
  channelReadQueries,
  type MaterialFilters,
} from "./queries";
import type {
  Channel,
  ChannelRead,
  Material,
  MaterialWithRelations,
  Message,
  MessageWithRelations,
  Profile,
  SavedMaterial,
  Subject,
} from "@/types/appwrite";

/**
 * Shared read helpers.
 *
 * Appwrite has no embedded joins, so relations are stitched together in
 * memory. The helper accepts both the server SDK and the web SDK because
 * their tablesDB services expose the same methods.
 */
export interface DataClient {
  tablesDB: {
    listRows(params: {
      databaseId: string;
      tableId: string;
      queries?: string[];
      total?: boolean;
    }): Promise<{ rows: Record<string, unknown>[]; total: number }>;
  };
}

async function rows<T>(
  client: DataClient,
  tableId: string,
  queries: string[],
): Promise<T[]> {
  const { rows: result } = await client.tablesDB.listRows({
    databaseId: DATABASE_ID,
    tableId,
    queries,
  });
  return result as unknown as T[];
}

export async function listProfiles(client: DataClient): Promise<Profile[]> {
  return rows<Profile>(client, TABLES.profiles, profileQueries());
}

export async function listSubjects(client: DataClient): Promise<Subject[]> {
  return rows<Subject>(client, TABLES.subjects, subjectQueries());
}

export async function listChannels(client: DataClient): Promise<Channel[]> {
  return rows<Channel>(client, TABLES.channels, channelQueries());
}

export async function listSavedMaterials(
  client: DataClient,
  userId: string,
): Promise<SavedMaterial[]> {
  return rows<SavedMaterial>(client, TABLES.savedMaterials, savedMaterialQueries(userId));
}

export async function listChannelReads(
  client: DataClient,
  userId: string,
): Promise<ChannelRead[]> {
  return rows<ChannelRead>(client, TABLES.channelReads, channelReadQueries(userId));
}

export async function listMaterials(
  client: DataClient,
  filters: MaterialFilters = {},
): Promise<MaterialWithRelations[]> {
  const materials = await rows<Material>(
    client,
    TABLES.materials,
    materialQueries(filters),
  );

  const [profiles, subjects] = await Promise.all([
    listProfiles(client),
    listSubjects(client),
  ]);
  const profileMap = new Map(profiles.map((profile) => [profile.userId, profile]));
  const subjectMap = new Map(subjects.map((subject) => [subject.$id, subject]));

  return materials.map((material) => ({
    ...material,
    uploader: profileMap.get(material.uploaderId) ?? null,
    subject: material.subjectId ? (subjectMap.get(material.subjectId) ?? null) : null,
  }));
}

export async function getMaterial(
  client: DataClient,
  materialId: string,
): Promise<MaterialWithRelations | null> {
  const { rows: result } = await client.tablesDB.listRows({
    databaseId: DATABASE_ID,
    tableId: TABLES.materials,
    queries: [Query.equal("$id", materialId), Query.limit(1)],
  });

  const material = result[0] as unknown as Material | undefined;
  if (!material) return null;

  const [profiles, subjects] = await Promise.all([
    listProfiles(client),
    listSubjects(client),
  ]);

  return {
    ...material,
    uploader: profiles.find((profile) => profile.userId === material.uploaderId) ?? null,
    subject: material.subjectId
      ? (subjects.find((subject) => subject.$id === material.subjectId) ?? null)
      : null,
  };
}

export async function listMessages(
  client: DataClient,
  channelId: string,
  limit = 50,
  cursor?: string,
): Promise<MessageWithRelations[]> {
  const messages = await rows<Message>(
    client,
    TABLES.messages,
    messageQueries(channelId, limit, cursor),
  );

  const [profiles, materials] = await Promise.all([
    listProfiles(client),
    rows<Material>(client, TABLES.materials, [Query.limit(100)]),
  ]);
  const profileMap = new Map(profiles.map((profile) => [profile.userId, profile]));
  const materialMap = new Map(materials.map((material) => [material.$id, material]));

  return messages
    .map((message) => {
      const material = message.materialId ? materialMap.get(message.materialId) : null;
      return {
        ...message,
        author: profileMap.get(message.userId) ?? null,
        material: material
          ? { $id: material.$id, title: material.title, type: material.type }
          : null,
      };
    })
    .reverse();
}

/** Latest message per channel, used for the unread dots. */
export async function latestMessagePerChannel(
  client: DataClient,
): Promise<Map<string, { at: string; id: string }>> {
  const messages = await rows<Message>(client, TABLES.messages, [
    Query.orderDesc("createdAt"),
    Query.limit(100),
  ]);

  const latest = new Map<string, { at: string; id: string }>();
  for (const message of messages) {
    if (!latest.has(message.channelId)) {
      latest.set(message.channelId, { at: message.createdAt, id: message.$id });
    }
  }
  return latest;
}
