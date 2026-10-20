/** Row shapes stored in Appwrite TablesDB. */

export type MaterialType = "book" | "pyq" | "question_bank" | "image" | "youtube";
export type MaterialKind = "file" | "link" | "youtube";

export type Profile = {
  $id: string;
  userId: string;
  name: string;
  avatarColor: string;
  exam: string | null;
  isAdmin: boolean;
  removed: boolean;
  createdAt: string;
  /** Filled in from the Appwrite account when the profile is loaded. */
  email?: string | null;
};

export type Subject = {
  $id: string;
  name: string;
  slug: string;
  createdBy: string | null;
  createdAt: string;
};

export type Material = {
  $id: string;
  title: string;
  description: string | null;
  type: MaterialType;
  subjectId: string | null;
  exam: string | null;
  year: number | null;
  tags: string[];
  kind: MaterialKind;
  fileId: string | null;
  fileName: string | null;
  fileSize: number | null;
  linkUrl: string | null;
  youtubeId: string | null;
  youtubeType: "video" | "playlist" | null;
  youtubeTitle: string | null;
  uploaderId: string;
  createdAt: string;
  /** Lower-cased title + tags + subject, used by the fulltext index. */
  searchText: string;
};

export type SavedMaterial = {
  $id: string;
  userId: string;
  materialId: string;
  createdAt: string;
};

export type Channel = {
  $id: string;
  name: string;
  slug: string;
  createdBy: string | null;
  createdAt: string;
};

export type Message = {
  $id: string;
  channelId: string;
  userId: string;
  body: string | null;
  fileId: string | null;
  materialId: string | null;
  createdAt: string;
};

export type ChannelRead = {
  $id: string;
  channelId: string;
  userId: string;
  lastReadAt: string;
};

export type StorageUsage = {
  totalBytes: number;
  materialBytes: number;
  chatBytes: number;
  fileCount: number;
  limitBytes: number;
  blockBytes: number;
  blocked: boolean;
};

/** A material plus the profile/subject it was joined with. */
export type MaterialWithRelations = Material & {
  uploader: Profile | null;
  subject: Subject | null;
};

/** A message plus its author and (optional) attached library item. */
export type MessageWithRelations = Message & {
  author: Profile | null;
  material: Pick<Material, "$id" | "title" | "type"> | null;
};
