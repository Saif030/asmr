/**
 * Creates the whole Khatmal Coaching schema in Appwrite.
 *
 * This is the Appwrite equivalent of the old SQL migrations: one command
 * provisions the database, tables, columns, indexes, buckets, the admins team
 * and the default channels/subjects.
 *
 *   node tools/appwrite-setup.mjs
 *
 * Required environment variables:
 *   NEXT_PUBLIC_APPWRITE_ENDPOINT   e.g. https://fra.cloud.appwrite.io/v1
 *   NEXT_PUBLIC_APPWRITE_PROJECT_ID  your project id
 *   APPWRITE_API_KEY                a server API key with the scopes listed below
 *
 * API key scopes:
 *   databases.write, collections.write, attributes.read, attributes.write,
 *   indexes.read, indexes.write, files.read, files.write, teams.read,
 *   teams.write, users.read, users.write
 */

import { Client, ID, Permission, Role, TablesDBIndexType } from "node-appwrite";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

// ---------------------------------------------------------------------------
// Environment
// ---------------------------------------------------------------------------
const here = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(here, "..", ".env.local");
const env = { ...process.env };

try {
  const raw = readFileSync(envPath, "utf8");
  for (const line of raw.split("\n")) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (match && !env[match[1]]) env[match[1]] = match[2].replace(/^["']|["']$/g, "");
  }
} catch {
  // No .env.local — rely on the real environment.
}

const ENDPOINT = env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const PROJECT_ID = env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const API_KEY = env.APPWRITE_API_KEY;

if (!ENDPOINT || !PROJECT_ID || !API_KEY) {
  console.error(
    "Missing configuration. Set NEXT_PUBLIC_APPWRITE_ENDPOINT, NEXT_PUBLIC_APPWRITE_PROJECT_ID and APPWRITE_API_KEY (see .env.example).",
  );
  process.exit(1);
}

const DATABASE_ID = env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "khatmal";
const ADMIN_TEAM_ID = env.APPWRITE_ADMIN_TEAM_ID || "admins";
const MATERIALS_BUCKET = env.NEXT_PUBLIC_APPWRITE_BUCKET_MATERIALS || "materials";
const CHAT_BUCKET = env.NEXT_PUBLIC_APPWRITE_BUCKET_CHAT || "chat-images";
const MAX_FILE_SIZE = 20 * 1024 * 1024;

const client = new Client().setEndpoint(ENDPOINT).setProject(PROJECT_ID).setKey(API_KEY);
const tablesDB = new (await import("node-appwrite")).TablesDB(client);
const storage = new (await import("node-appwrite")).Storage(client);
const teams = new (await import("node-appwrite")).Teams(client);

// ---------------------------------------------------------------------------
// Permission model
//   members  : every signed-in member
//   owner    : the row's creator
//   admins   : members of the "admins" team (the first account joins it)
// ---------------------------------------------------------------------------
const members = Permission.read(Role.users());
const create = Permission.create(Role.users());
const adminsUpdate = Permission.update(Role.team(ADMIN_TEAM_ID));
const adminsDelete = Permission.delete(Role.team(ADMIN_TEAM_ID));

/** Shared tables: everyone reads, owners edit, admins edit anything. */
const sharedTablePermissions = [members, create, adminsUpdate, adminsDelete];

/** Personal tables: only the owner can ever see a row. */
const personalTablePermissions = [create];

// ---------------------------------------------------------------------------
// Schema definition
// ---------------------------------------------------------------------------
const TABLES = [
  {
    id: "profiles",
    name: "Profiles",
    permissions: sharedTablePermissions,
    columns: [
      ["userId", "string", { size: 64, required: true }],
      ["name", "string", { size: 128, required: true }],
      ["avatarColor", "string", { size: 32, required: false, xdefault: "#4F7CFF" }],
      ["exam", "string", { size: 128, required: false }],
      ["isAdmin", "boolean", { required: false, xdefault: false }],
      ["removed", "boolean", { required: false, xdefault: false }],
      ["createdAt", "datetime", { required: false }],
    ],
    indexes: [
      { key: "unique_userId", type: "unique", columns: ["userId"], orders: ["ASC"] },
      { key: "idx_createdAt", type: "key", columns: ["createdAt"], orders: ["ASC"] },
    ],
  },
  {
    id: "subjects",
    name: "Subjects",
    permissions: sharedTablePermissions,
    columns: [
      ["name", "string", { size: 64, required: true }],
      ["slug", "string", { size: 64, required: true }],
      ["createdBy", "string", { size: 64, required: false }],
      ["createdAt", "datetime", { required: false }],
    ],
    indexes: [
      { key: "unique_slug", type: "unique", columns: ["slug"], orders: ["ASC"] },
    ],
  },
  {
    id: "materials",
    name: "Materials",
    permissions: sharedTablePermissions,
    columns: [
      ["title", "string", { size: 256, required: true }],
      ["description", "string", { size: 4000, required: false }],
      ["type", "string", { size: 32, required: true }],
      ["subjectId", "string", { size: 64, required: false }],
      ["exam", "string", { size: 128, required: false }],
      ["year", "integer", { required: false }],
      ["tags", "string", { size: 64, required: false, array: true }],
      ["kind", "string", { size: 16, required: true }],
      ["fileId", "string", { size: 128, required: false }],
      ["fileName", "string", { size: 256, required: false }],
      ["fileSize", "integer", { required: false }],
      ["linkUrl", "string", { size: 2048, required: false }],
      ["youtubeId", "string", { size: 64, required: false }],
      ["youtubeType", "string", { size: 16, required: false }],
      ["youtubeTitle", "string", { size: 256, required: false }],
      ["uploaderId", "string", { size: 64, required: true }],
      ["searchText", "string", { size: 4000, required: false }],
      ["createdAt", "datetime", { required: false }],
    ],
    indexes: [
      { key: "idx_searchText", type: "fulltext", columns: ["searchText"], orders: ["ASC"] },
      { key: "idx_type", type: "key", columns: ["type"], orders: ["ASC"] },
      { key: "idx_subjectId", type: "key", columns: ["subjectId"], orders: ["ASC"] },
      { key: "idx_year", type: "key", columns: ["year"], orders: ["ASC"] },
      { key: "idx_uploaderId", type: "key", columns: ["uploaderId"], orders: ["ASC"] },
      { key: "idx_createdAt", type: "key", columns: ["createdAt"], orders: ["ASC"] },
    ],
  },
  {
    id: "saved_materials",
    name: "Saved materials",
    permissions: personalTablePermissions,
    columns: [
      ["userId", "string", { size: 64, required: true }],
      ["materialId", "string", { size: 64, required: true }],
      ["createdAt", "datetime", { required: false }],
    ],
    indexes: [
      {
        key: "unique_user_material",
        type: "unique",
        columns: ["userId", "materialId"],
        orders: ["ASC", "ASC"],
      },
    ],
  },
  {
    id: "channels",
    name: "Channels",
    permissions: sharedTablePermissions,
    columns: [
      ["name", "string", { size: 64, required: true }],
      ["slug", "string", { size: 64, required: true }],
      ["createdBy", "string", { size: 64, required: false }],
      ["createdAt", "datetime", { required: false }],
    ],
    indexes: [
      { key: "unique_slug", type: "unique", columns: ["slug"], orders: ["ASC"] },
      { key: "idx_createdAt", type: "key", columns: ["createdAt"], orders: ["ASC"] },
    ],
  },
  {
    id: "messages",
    name: "Messages",
    permissions: sharedTablePermissions,
    columns: [
      ["channelId", "string", { size: 64, required: true }],
      ["userId", "string", { size: 64, required: true }],
      ["body", "string", { size: 4000, required: false }],
      ["fileId", "string", { size: 128, required: false }],
      ["materialId", "string", { size: 64, required: false }],
      ["createdAt", "datetime", { required: false }],
    ],
    indexes: [
      {
        key: "idx_channel_created",
        type: "key",
        columns: ["channelId", "createdAt"],
        orders: ["ASC", "ASC"],
      },
    ],
  },
  {
    id: "channel_reads",
    name: "Channel read markers",
    permissions: personalTablePermissions,
    columns: [
      ["channelId", "string", { size: 64, required: true }],
      ["userId", "string", { size: 64, required: true }],
      ["lastReadAt", "datetime", { required: false }],
    ],
    indexes: [
      {
        key: "unique_channel_user",
        type: "unique",
        columns: ["channelId", "userId"],
        orders: ["ASC", "ASC"],
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function ignoreMissing(label, fn) {
  try {
    await fn();
    console.log(`  + ${label}`);
    return true;
  } catch (error) {
    const message = String(error?.message ?? error);
    if (/already exists|409|conflict/i.test(message)) {
      console.log(`  = ${label} (already exists)`);
      return false;
    }
    console.error(`  ! ${label}: ${message}`);
    return false;
  }
}

async function createColumn(tableId, [key, type, options]) {
  const base = { databaseId: DATABASE_ID, tableId, key, required: options.required };
  switch (type) {
    case "string":
      return tablesDB.createStringColumn({
        ...base,
        size: options.size ?? 255,
        xdefault: options.xdefault ?? null,
        array: options.array ?? false,
      });
    case "integer":
      return tablesDB.createIntegerColumn({
        ...base,
        xdefault: options.xdefault ?? null,
        array: options.array ?? false,
      });
    case "boolean":
      return tablesDB.createBooleanColumn({
        ...base,
        xdefault: options.xdefault ?? null,
        array: options.array ?? false,
      });
    case "datetime":
      return tablesDB.createDatetimeColumn({
        ...base,
        xdefault: options.xdefault ?? null,
        array: options.array ?? false,
      });
    default:
      throw new Error(`unknown column type ${type}`);
  }
}

/** Indexes need their columns to finish provisioning first. */
async function waitForColumns(tableId, keys) {
  for (let attempt = 0; attempt < 30; attempt++) {
    const { columns } = await tablesDB.listColumns({ databaseId: DATABASE_ID, tableId });
    const pending = keys.filter(
      (key) => !columns.some((column) => column.key === key && column.status === "available"),
    );
    if (!pending.length) return true;
    await sleep(2000);
  }
  return false;
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------
console.log(`Khatmal Coaching → Appwrite project ${PROJECT_ID}\n`);

console.log("Database");
await ignoreMissing(`database "${DATABASE_ID}"`, () =>
  tablesDB.create({ databaseId: DATABASE_ID, name: "Khatmal Coaching", enabled: true }),
);

for (const table of TABLES) {
  console.log(`\nTable ${table.id}`);
  await ignoreMissing(`table "${table.id}"`, () =>
    tablesDB.createTable({
      databaseId: DATABASE_ID,
      tableId: table.id,
      name: table.name,
      permissions: table.permissions,
      rowSecurity: true,
      enabled: true,
    }),
  );

  for (const column of table.columns) {
    await ignoreMissing(`column "${column[0]}"`, () => createColumn(table.id, column));
  }

  await waitForColumns(
    table.id,
    table.indexes.flatMap((index) => index.columns),
  );

  for (const index of table.indexes) {
    await ignoreMissing(`index "${index.key}"`, () =>
      tablesDB.createIndex({
        databaseId: DATABASE_ID,
        tableId: table.id,
        key: index.key,
        type: index.type === "unique" ? TablesDBIndexType.Unique : TablesDBIndexType.Key,
        columns: index.columns,
        orders: index.orders,
      }),
    );
  }
}

console.log("\nBuckets");
for (const [bucketId, name, size] of [
  [MATERIALS_BUCKET, "Library files", MAX_FILE_SIZE],
  [CHAT_BUCKET, "Chat images", 5 * 1024 * 1024],
]) {
  await ignoreMissing(`bucket "${bucketId}"`, () =>
    storage.createBucket({
      bucketId,
      name,
      permissions: [
        Permission.read(Role.any()),
        Permission.create(Role.users()),
        Permission.update(Role.users()),
        Permission.delete(Role.users()),
        Permission.update(Role.team(ADMIN_TEAM_ID)),
        Permission.delete(Role.team(ADMIN_TEAM_ID)),
      ],
      fileSecurity: false,
      enabled: true,
      maximumFileSize: size,
      allowedFileExtensions: ["pdf", "jpg", "jpeg", "png", "webp", "gif"],
      compression: "gzip",
      encryption: true,
      antivirus: false,
    }),
  );
}

console.log("\nTeam");
await ignoreMissing(`team "${ADMIN_TEAM_ID}"`, () =>
  teams.create({
    teamId: ADMIN_TEAM_ID,
    name: "Admins",
    permissions: [Permission.read(Role.users()), Permission.update(Role.team(ADMIN_TEAM_ID))],
  }),
);

console.log("\nSeed data");
const now = new Date().toISOString();
for (const [name, slug] of [
  ["general", "general"],
  ["physics", "physics"],
  ["chemistry", "chemistry"],
  ["maths", "maths"],
  ["motivation", "motivation"],
]) {
  await ignoreMissing(`channel #${name}`, () =>
    tablesDB.createRow({
      databaseId: DATABASE_ID,
      tableId: "channels",
      rowId: ID.unique(),
      data: { name, slug, createdBy: null, createdAt: now },
      permissions: [members],
    }),
  );
}

for (const [name, slug] of [
  ["Physics", "physics"],
  ["Chemistry", "chemistry"],
  ["Mathematics", "maths"],
  ["Biology", "biology"],
  ["General", "general"],
]) {
  await ignoreMissing(`subject ${name}`, () =>
    tablesDB.createRow({
      databaseId: DATABASE_ID,
      tableId: "subjects",
      rowId: ID.unique(),
      data: { name, slug, createdBy: null, createdAt: now },
      permissions: [members],
    }),
  );
}

console.log("\nDone. Next: start the app and sign up — the first account becomes an admin.");
