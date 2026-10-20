/**
 * Local mock of the Appwrite REST API — development fixture only.
 *
 * It lets the UI be exercised and screenshotted without a real Appwrite
 * project. It is NOT a security boundary and must never be deployed.
 *
 *   node tools/mock-appwrite.mjs        # listens on http://127.0.0.1:54321/v1
 *
 * Then point .env.local at it:
 *   NEXT_PUBLIC_APPWRITE_ENDPOINT=http://127.0.0.1:54321/v1
 *   NEXT_PUBLIC_APPWRITE_PROJECT_ID=mock-project
 *   APPWRITE_API_KEY=mock-key
 */

import http from "node:http";
import { randomUUID } from "node:crypto";

const PORT = Number(process.env.MOCK_PORT ?? 54321);
const SESSION_SECRET = "mock-session-secret";

const user = {
  $id: "11111111-1111-4111-8111-111111111111",
  name: "Aisha Khan",
  email: "aisha@example.com",
  registration: new Date().toISOString(),
  status: true,
  passwordUpdate: new Date().toISOString(),
  labels: [],
  phone: "",
  mfa: false,
  prefs: {},
  targets: [],
  $createdAt: new Date().toISOString(),
  $updatedAt: new Date().toISOString(),
};

const session = {
  $id: "session-1",
  $createdAt: new Date().toISOString(),
  $updatedAt: new Date().toISOString(),
  userId: user.$id,
  secret: SESSION_SECRET,
  expire: new Date(Date.now() + 60 * 60 * 24 * 365 * 1000).toISOString(),
  current: true,
  provider: "email",
  providerEmail: user.email,
  providerUserId: user.$id,
  factors: [],
  secretKey: "mock",
  appName: "Khatmal Coaching",
  appId: "mock",
  ip: "127.0.0.1",
  os: "win32",
  clientName: "mock",
  clientCode: "mock",
  clientEngine: "mock",
  clientEngineVersion: "1",
  deviceName: "mock",
  deviceCode: "mock",
  deviceType: "desktop",
  modelCode: "mock",
  modelName: "mock",
  modelVendor: "mock",
  countryCode: "us",
  countryName: "United States",
  city: "mock",
  region: "mock",
  locale: "en-US",
  languages: ["en"],
};

const now = Date.now();
const iso = (offsetMs) => new Date(now + offsetMs).toISOString();

const tables = {
  profiles: process.env.MOCK_EMPTY ? [] : [
    {
      $id: "p-1",
      userId: user.$id,
      name: "Aisha Khan",
      avatarColor: "#4F7CFF",
      exam: "JEE 2026",
      isAdmin: true,
      removed: false,
      createdAt: iso(-1000 * 60 * 60 * 24 * 40),
    },
    {
      $id: "p-2",
      userId: "22222222-2222-4222-8222-222222222222",
      name: "Rohan Verma",
      avatarColor: "#7C5CFF",
      exam: "NEET",
      isAdmin: false,
      removed: false,
      createdAt: iso(-1000 * 60 * 60 * 24 * 30),
    },
    {
      $id: "p-3",
      userId: "33333333-3333-4333-8333-333333333333",
      name: "Meera Iyer",
      avatarColor: "#0EA5A4",
      exam: "Class 12",
      isAdmin: false,
      removed: false,
      createdAt: iso(-1000 * 60 * 60 * 24 * 20),
    },
  ],
  subjects: [
    { $id: "s-physics", name: "Physics", slug: "physics", createdBy: null, createdAt: iso(-1e9) },
    { $id: "s-chemistry", name: "Chemistry", slug: "chemistry", createdBy: null, createdAt: iso(-1e9) },
    { $id: "s-maths", name: "Mathematics", slug: "maths", createdBy: null, createdAt: iso(-1e9) },
    { $id: "s-biology", name: "Biology", slug: "biology", createdBy: null, createdAt: iso(-1e9) },
  ],
  channels: [
    { $id: "c-general", name: "general", slug: "general", createdBy: null, createdAt: iso(-1e9) },
    { $id: "c-physics", name: "physics", slug: "physics", createdBy: null, createdAt: iso(-1e9) },
    { $id: "c-chemistry", name: "chemistry", slug: "chemistry", createdBy: null, createdAt: iso(-1e9) },
    { $id: "c-motivation", name: "motivation", slug: "motivation", createdBy: null, createdAt: iso(-1e9) },
  ],
  materials: [
    {
      $id: "m-1",
      title: "Class 12 Physics — Complete NCERT",
      description: "Full textbook PDF with every chapter and solved examples.",
      type: "book",
      subjectId: "s-physics",
      exam: "Class 12",
      year: 2024,
      tags: ["ncert", "physics", "textbook"],
      kind: "link",
      fileId: null,
      fileName: null,
      fileSize: null,
      linkUrl: "https://drive.google.com/example-ncert-physics",
      youtubeId: null,
      youtubeType: null,
      youtubeTitle: null,
      uploaderId: "22222222-2222-4222-8222-222222222222",
      searchText: "class 12 physics — complete ncert ncert physics textbook physics",
      createdAt: iso(-1000 * 60 * 60 * 3),
    },
    {
      $id: "m-2",
      title: "JEE Main 2024 — Previous Year Questions",
      description: "All shifts, chapter-wise and marked. Answers included at the end.",
      type: "pyq",
      subjectId: "s-maths",
      exam: "JEE",
      year: 2024,
      tags: ["jee", "pyq", "maths"],
      kind: "file",
      fileId: "file-jee-main-2024",
      fileName: "jee-main-2024.pdf",
      fileSize: 4_200_000,
      linkUrl: null,
      youtubeId: null,
      youtubeType: null,
      youtubeTitle: null,
      uploaderId: "33333333-3333-4333-8333-333333333333",
      searchText: "jee main 2024 — previous year questions jee pyq maths maths",
      createdAt: iso(-1000 * 60 * 60 * 26),
    },
    {
      $id: "m-3",
      title: "Rotational Motion — full lecture",
      description: "Long-form derivation plus problem solving marathon.",
      type: "youtube",
      subjectId: "s-physics",
      exam: null,
      year: null,
      tags: ["lecture", "mechanics"],
      kind: "youtube",
      fileId: null,
      fileName: null,
      fileSize: null,
      linkUrl: null,
      youtubeId: "dQw4w9WgXcQ",
      youtubeType: "video",
      youtubeTitle: "Physics Marathon — Rotational Motion",
      uploaderId: user.$id,
      searchText: "rotational motion — full lecture lecture mechanics physics",
      createdAt: iso(-1000 * 60 * 60 * 50),
    },
    {
      $id: "m-4",
      title: "Organic Chemistry — reaction map",
      description: "Handwritten summary sheet, A4, readable scan.",
      type: "image",
      subjectId: "s-chemistry",
      exam: "Class 12",
      year: null,
      tags: ["notes", "organic"],
      kind: "file",
      fileId: "file-organic-map",
      fileName: "organic-reaction-map.png",
      fileSize: 840_000,
      linkUrl: null,
      youtubeId: null,
      youtubeType: null,
      youtubeTitle: null,
      uploaderId: "22222222-2222-4222-8222-222222222222",
      searchText: "organic chemistry — reaction map notes organic chemistry",
      createdAt: iso(-1000 * 60 * 60 * 72),
    },
  ],
  saved_materials: [
    { $id: "sm-1", userId: user.$id, materialId: "m-1", createdAt: iso(-1e6) },
  ],
  messages: [
    {
      $id: "msg-1",
      channelId: "c-general",
      userId: "22222222-2222-4222-8222-222222222222",
      body: "Morning everyone — I uploaded the JEE 2024 PYQ set.",
      fileId: null,
      materialId: "m-2",
      createdAt: iso(-1000 * 60 * 42),
    },
    {
      $id: "msg-2",
      channelId: "c-general",
      userId: user.$id,
      body: "This lecture is perfect for rotational motion: https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      fileId: null,
      materialId: null,
      createdAt: iso(-1000 * 60 * 30),
    },
    {
      $id: "msg-3",
      channelId: "c-physics",
      userId: "33333333-3333-4333-8333-333333333333",
      body: "Anyone done with problem 6.14? I get a different sign.",
      fileId: null,
      materialId: null,
      createdAt: iso(-1000 * 60 * 12),
    },
  ],
  channel_reads: [
    { $id: "cr-1", channelId: "c-general", userId: user.$id, lastReadAt: iso(-1000 * 60 * 25) },
    { $id: "cr-2", channelId: "c-physics", userId: user.$id, lastReadAt: iso(-1000 * 60 * 60 * 30) },
  ],
};

const files = [
  {
    $id: "file-jee-main-2024",
    $collectionId: "materials",
    $permissions: [],
    name: "jee-main-2024.pdf",
    nameOriginal: "jee-main-2024.pdf",
    mimeType: "application/pdf",
    sizeOriginal: 4_200_000,
    size: 4_200_000,
    extension: "pdf",
    $createdAt: iso(-1e9),
    $updatedAt: iso(-1e9),
  },
  {
    $id: "file-organic-map",
    $collectionId: "materials",
    $permissions: [],
    name: "organic-reaction-map.png",
    nameOriginal: "organic-reaction-map.png",
    mimeType: "image/png",
    sizeOriginal: 840_000,
    size: 840_000,
    extension: "png",
    $createdAt: iso(-1e9),
    $updatedAt: iso(-1e9),
  },
];

const memberships = [
  {
    $id: user.$id,
    $createdAt: iso(-1e9),
    $updatedAt: iso(-1e9),
    userId: user.$id,
    teamId: "admins",
    roles: ["admin"],
    name: user.name,
    email: user.email,
    status: "accepted",
  },
];

/** A 1x1 transparent PNG used as a stand-in for stored files. */
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

// ---------------------------------------------------------------------------
// Query evaluation: equal("attr","value"), limit(10), orderDesc("createdAt")…
// ---------------------------------------------------------------------------
function parseQueries(url) {
  const raw = url.searchParams.getAll("queries[]");
  if (raw.length) return raw;
  const collected = [];
  for (const [key, value] of url.searchParams.entries()) {
    const match = key.match(/^queries\[(\d+)\]$/);
    if (match) collected.push([Number(match[1]), value]);
  }
  return collected.sort((a, b) => a[0] - b[0]).map(([, value]) => value);
}

function parseQuery(query) {
  // The web SDK sends structured queries as JSON
  // ({"method":"equal","attribute":"x","values":["y"]}) while the server SDK
  // sends the legacy string form (equal("x","y")). Accept both.
  if (query.trim().startsWith("{")) {
    try {
      const parsed = JSON.parse(query);
      const values = Array.isArray(parsed.values) ? parsed.values : [];
      const args = parsed.attribute !== undefined ? [parsed.attribute, ...values] : values;
      return { method: parsed.method, args };
    } catch {
      return null;
    }
  }

  const match = query.match(/^(\w+)\((.*)\)$/s);
  if (!match) return null;
  const method = match[1];
  const args = [];
  let depth = 0;
  let current = "";
  let inString = false;
  for (const char of match[2]) {
    if (char === '"' && depth === 0) {
      inString = !inString;
      current += char;
      continue;
    }
    if (char === "(" && !inString) depth++;
    if (char === ")" && !inString) depth--;
    if (char === "," && depth === 0 && !inString) {
      args.push(current.trim().replace(/^"|"$/g, ""));
      current = "";
      continue;
    }
    current += char;
  }
  if (current.trim()) args.push(current.trim().replace(/^"|"$/g, ""));
  return { method, args };
}

function applyQueries(rows, queries) {
  let result = [...rows];
  let limit = null;
  let cursorAfter = null;
  const orderings = [];

  for (const query of queries) {
    const parsed = parseQuery(query);
    if (!parsed) continue;
    const { method, args } = parsed;

    switch (method) {
      case "equal":
        result = result.filter((row) => String(row[args[0]]) === args[1]);
        break;
      case "notEqual":
        result = result.filter((row) => String(row[args[0]]) !== args[1]);
        break;
      case "limit":
        limit = Number(args[0]);
        break;
      case "cursorAfter":
        cursorAfter = args[0];
        break;
      case "orderAsc":
        orderings.push([args[0], 1]);
        break;
      case "orderDesc":
        orderings.push([args[0], -1]);
        break;
      case "search":
        result = result.filter((row) =>
          String(row[args[0]] ?? "")
            .toLowerCase()
            .includes(String(args[1] ?? "").toLowerCase()),
        );
        break;
      case "contains":
        result = result.filter((row) => {
          const value = row[args[0]];
          return Array.isArray(value)
            ? value.map(String).includes(args[1])
            : String(value).includes(args[1]);
        });
        break;
      case "greaterThan":
        result = result.filter((row) => Number(row[args[0]]) > Number(args[1]));
        break;
      case "lessThan":
        result = result.filter((row) => Number(row[args[0]]) < Number(args[1]));
        break;
      case "startsWith":
        result = result.filter((row) =>
          String(row[args[0]] ?? "").toLowerCase().startsWith(args[1].toLowerCase()),
        );
        break;
      case "isNull":
        result = result.filter((row) => row[args[0]] === null || row[args[0]] === undefined);
        break;
      default:
        break;
    }
  }

  for (const [column, direction] of orderings.reverse()) {
    result.sort((a, b) => {
      const left = String(a[column] ?? "");
      const right = String(b[column] ?? "");
      return direction === 1 ? left.localeCompare(right) : right.localeCompare(left);
    });
  }

  if (cursorAfter) {
    const index = result.findIndex((row) => row.$id === cursorAfter);
    if (index >= 0) result = result.slice(index + 1);
  }

  const total = result.length;
  if (limit !== null) result = result.slice(0, limit);
  return { rows: result, total };
}

// ---------------------------------------------------------------------------
// Server
// ---------------------------------------------------------------------------
function readBody(req) {
  return new Promise((resolve) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => {
      try {
        resolve(data ? JSON.parse(data) : null);
      } catch {
        resolve(null);
      }
    });
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://127.0.0.1:${PORT}`);
  const path = url.pathname.replace(/^\/v1/, "");

  // The Appwrite web SDK sends `credentials: "include"`, so the mock has to
  // echo the origin and allow credentials — a wildcard origin is rejected.
  const corsHeaders = () => {
    const origin = req.headers.origin ?? "*";
    const requested = req.headers["access-control-request-headers"];
    return {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Allow-Headers": requested ?? "*",
      "Access-Control-Expose-Headers": "x-appwrite-total,content-range",
      "Access-Control-Allow-Methods": "GET,POST,PATCH,PUT,DELETE,OPTIONS",
    };
  };

  const json = (status, body) => {
    const payload = JSON.stringify(body);
    res.writeHead(status, {
      "Content-Type": "application/json",
      ...corsHeaders(),
    });
    res.end(payload);
  };

  if (req.method === "OPTIONS") return json(204, {});

  if (process.env.MOCK_LOG) console.log(`[mock] ${req.method} ${req.url}`);

  // ---- Ping --------------------------------------------------------------
  if (path === "/ping") {
    return json(200, { time: new Date().toISOString(), region: "mock" });
  }

  // ---- Account -----------------------------------------------------------
  if (path === "/account" && req.method === "GET") {
    return json(200, user);
  }
  if (path === "/account/sessions/email" && req.method === "POST") {
    const body = (await readBody(req)) ?? {};
    if (!body.email) return json(400, { message: "Email is required" });
    return json(201, { ...session, secret: SESSION_SECRET });
  }
  if (path === "/account/sessions" && req.method === "GET") {
    return json(200, [session]);
  }
  if (path.startsWith("/account/sessions/") && req.method === "DELETE") {
    return json(204, {});
  }

  // ---- Users -------------------------------------------------------------
  if (path === "/users" && req.method === "POST") {
    const body = (await readBody(req)) ?? {};
    return json(201, { ...user, $id: body.userId ?? randomUUID(), email: body.email });
  }
  if (path.startsWith("/users/") && req.method === "DELETE") {
    return json(204, {});
  }

  // ---- Teams -------------------------------------------------------------
  if (path.startsWith("/teams/") && path.includes("/memberships")) {
    const teamId = path.split("/")[2];
    if (req.method === "POST") {
      const body = (await readBody(req)) ?? {};
      const membership = {
        $id: body.userId ?? randomUUID(),
        userId: body.userId ?? user.$id,
        teamId,
        roles: body.roles ?? [],
        name: user.name,
        email: user.email,
        status: "accepted",
        $createdAt: new Date().toISOString(),
        $updatedAt: new Date().toISOString(),
      };
      memberships.push(membership);
      return json(201, membership);
    }
    if (path.split("/").length === 5 && req.method === "GET") {
      const membershipId = path.split("/")[4];
      const found = memberships.find((item) => item.$id === membershipId);
      if (!found) return json(404, { message: "Membership not found" });
      return json(200, found);
    }
    if (req.method === "GET") {
      return json(200, { total: memberships.length, memberships });
    }
  }

  // ---- Storage -----------------------------------------------------------
  if (path.startsWith("/storage/buckets/")) {
    const [, , , bucketId, , fileId] = path.split("/");

    if (path.endsWith("/files") && req.method === "GET") {
      const { rows, total } = applyQueries(
        files.filter((file) => file.$collectionId === bucketId),
        parseQueries(url),
      );
      res.writeHead(200, {
        "Content-Type": "application/json",
        "x-appwrite-total": String(total),
        ...corsHeaders(),
      });
      return res.end(JSON.stringify({ total, files: rows }));
    }

    if (path.endsWith("/files") && req.method === "POST") {
      await readBody(req);
      const created = {
        $id: randomUUID(),
        $collectionId: bucketId,
        name: "upload",
        nameOriginal: "upload",
        mimeType: "application/octet-stream",
        sizeOriginal: 1024,
        size: 1024,
        extension: "bin",
        $createdAt: new Date().toISOString(),
        $updatedAt: new Date().toISOString(),
        $permissions: [],
      };
      files.push(created);
      return json(201, created);
    }

    if (fileId && path.endsWith("/view")) {
      res.writeHead(200, { "Content-Type": "image/png", "Content-Length": PNG.length });
      return res.end(PNG);
    }

    if (fileId && path.endsWith("/download")) {
      res.writeHead(200, { "Content-Type": "application/octet-stream" });
      return res.end(PNG);
    }

    if (fileId && req.method === "DELETE") {
      const index = files.findIndex((file) => file.$id === fileId);
      if (index >= 0) files.splice(index, 1);
      return json(204, {});
    }
  }

  // ---- TablesDB rows -----------------------------------------------------
  const rowsMatch = path.match(/^\/tablesdb\/([^/]+)\/tables\/([^/]+)\/rows(?:\/([^/]+))?$/);
  if (rowsMatch) {
    const [, , tableId, rowId] = rowsMatch;
    const table = tables[tableId];
    if (!table) return json(404, { message: `Unknown table ${tableId}` });

    if (req.method === "GET" && !rowId) {
      const { rows, total } = applyQueries(table, parseQueries(url));
      res.writeHead(200, {
        "Content-Type": "application/json",
        "x-appwrite-total": String(total),
        ...corsHeaders(),
      });
      return res.end(JSON.stringify({ total, rows }));
    }

    if (req.method === "GET" && rowId) {
      const found = table.find((row) => row.$id === rowId);
      if (!found) return json(404, { message: "Row not found" });
      return json(200, found);
    }

    if (req.method === "POST" && !rowId) {
      const body = (await readBody(req)) ?? {};
      const created = {
        $id: body.$id ?? randomUUID(),
        ...body,
        $createdAt: new Date().toISOString(),
        $updatedAt: new Date().toISOString(),
        $permissions: body.$permissions ?? [],
      };
      delete created.$permissions;
      table.push(created);
      return json(201, created);
    }

    if (req.method === "PATCH" && rowId) {
      const body = (await readBody(req)) ?? {};
      const index = table.findIndex((row) => row.$id === rowId);
      if (index < 0) return json(404, { message: "Row not found" });
      table[index] = {
        ...table[index],
        ...body,
        $id: rowId,
        $updatedAt: new Date().toISOString(),
      };
      return json(200, table[index]);
    }

    if (req.method === "DELETE" && !rowId) {
      const { rows } = applyQueries(table, parseQueries(url));
      const ids = new Set(rows.map((row) => row.$id));
      const kept = table.filter((row) => !ids.has(row.$id));
      table.length = 0;
      table.push(...kept);
      return json(200, { total: 0, rows: [] });
    }

    if (req.method === "DELETE" && rowId) {
      const index = table.findIndex((row) => row.$id === rowId);
      if (index >= 0) table.splice(index, 1);
      return json(204, {});
    }
  }

  return json(404, { message: `no mock for ${req.method} ${path}` });
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`mock appwrite listening on http://127.0.0.1:${PORT}/v1`);
});
