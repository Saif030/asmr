# Khatmal Coaching

A private study-sharing hub for a small friend group (5–30 people). Members share
study material (books, PYQs, question banks, notes, YouTube lectures) and chat in
per-subject channels.

**Everything runs on free tiers. No paid services, no credit card, no API keys.**

Backend: **Appwrite** (Auth, TablesDB, Storage, Realtime) · Frontend: **Next.js 16**
(App Router, TypeScript, Tailwind v4) · Hosting: **Vercel Hobby**.

---

## Table of contents

1. [What you get](#what-you-get)
2. [The stack (100% free)](#the-stack-100-free)
3. [Free-tier limits and how the app respects them](#free-tier-limits-and-how-the-app-respects-them)
4. [How access control works on Appwrite](#how-access-control-works-on-appwrite)
5. [Setup — step by step](#setup--step-by-step)
6. [Running and testing locally](#running-and-testing-locally)
7. [Deploying to Vercel (free)](#deploying-to-vercel-free)
8. [Keepalive: stopping Appwrite from pausing a free project](#keepalive-stopping-appwrite-from-pausing-a-free-project)
9. [Project structure](#project-structure)
10. [Troubleshooting](#troubleshooting)
11. [Cost summary](#cost-summary)

---

## What you get

| Area | Features |
| --- | --- |
| **Access control** | Invite-code signup, email + password only, first member becomes admin, admin can remove members and delete any content, initials-based avatars (no upload) |
| **Library** | 5 material types (Books, PYQs, Question Banks, Images/Notes, YouTube), file upload **or** external link, client-side image compression, fulltext search + filters + sort, in-browser PDF preview, image lightbox, download, bookmarks ("My Saved"), owner edit/delete |
| **YouTube** | Paste a URL → title + thumbnail fetched automatically via the free oEmbed endpoint, inline privacy-enhanced player, playlist support |
| **Chat** | Appwrite Realtime, per-subject channels (creatable), text + images + links, YouTube link previews, attach a library item to a message, avatars, timestamps, auto-scroll, load older messages on scroll-up, unread dot per channel, 5,000-message cap per channel |
| **Home** | Recently added material, your saved items, latest chat activity |
| **Admin** | Storage usage indicator, upload blocking near the ceiling, content moderation, member removal |

---

## The stack (100% free)

| Piece | Service | Free tier |
| --- | --- | --- |
| Framework | Next.js 16 (App Router) + TypeScript | Open source |
| Styling | Tailwind CSS v4 + shadcn-style components + lucide-react | Open source |
| Auth / Database / Storage / Realtime | **Appwrite** (Education plan) | 150 GB storage, 2 TB bandwidth/mo, unlimited buckets & databases, no pausing |
| Hosting | Vercel Hobby | 100 GB bandwidth/mo |
| YouTube metadata | `youtube.com/oembed` + `img.youtube.com` thumbnails | Free, no API key |
| Fonts | Inter via `next/font` (Google Fonts) | Free |
| Keepalive | GitHub Actions (scheduled workflow) | Free for public and private repos |

There is **no** paid API anywhere: no OpenAI, no Sentry, no paid PDF viewer, no
image CDN, no YouTube Data API key.

> **Using the Appwrite Education plan?** Everything below is tuned for it. The
> app also runs on the plain **Free** plan (2 GB storage) — see
> [Free-tier limits](#free-tier-limits-and-how-the-app-respects-them) for the two
> things to change.

---

## Free-tier limits and how the app respects them

Appwrite's **Education plan** gives 150 GB of storage, 2 TB of bandwidth per
month, unlimited buckets and databases, and **never pauses** the project. The
**Free plan** gives 2 GB of storage, one bucket per project, and pauses after 7
days of inactivity. The app is built to stay comfortable on both:

- **Uploads are capped per file**: PDFs ≤ 20 MB, images ≤ 5 MB. The same rules
  are enforced in the browser *and* by the bucket's `maximumFileSize` and
  `allowedFileExtensions`, so a tampered client cannot get around them.
- **Images are compressed client-side** before upload (max 1600 px wide, JPEG/WebP
  at ~0.8 quality). Chat images are compressed harder (1280 px, 0.72 quality) and
  capped at 2 MB.
- **Big books are meant to be links.** The upload panel explicitly nudges people
  towards "Link" for textbooks and share the Google Drive / Mega copy instead —
  nothing is stored on your Appwrite account.
- **A storage indicator lives on the admin page** (`/admin`) showing exact bytes
  per bucket, a progress bar against the ceiling, and a warning state.
  **Uploads are blocked at 93 % of the limit** (≈ 140 GB on the Education plan).
  Set `APPWRITE_STORAGE_LIMIT_BYTES` to change the ceiling.
- **Deleting an item also deletes its file** from Storage, and replacing or
  re-typing an item cleans up the old file.
- **Chat is capped at the newest 5,000 messages per channel** by the server, so
  the database stays small over time.
- **Appwrite pauses free projects after 7 days of inactivity**, so `/api/keepalive`
  runs a light ping and a ready-to-use GitHub Actions workflow calls it every
  3 days. (The Education plan never pauses, so it is only a safety net there.)

---

## How access control works on Appwrite

Appwrite has no RLS, so the equivalent rules are expressed with Appwrite
permissions:

| Scope | Table | Permissions |
| --- | --- | --- |
| Shared | `profiles`, `subjects`, `materials`, `channels`, `messages` | `read("users")`, `create("users")`, `update/delete("team:admins")` |
| Per row | the same | owner gets `update/delete("user:<id>")`, admins team gets `update/delete` on **any** row |
| Personal | `saved_materials`, `channel_reads` | `read/update/delete("user:<id>")` only — nobody else can see them |

- **Every member can read** the shared tables (needed for chat avatars and the
  library) and can create rows.
- **The owner** of a row can edit or delete it.
- **Admins** are the members of an Appwrite **team** (`admins`). The first
  account that signs up is added to that team automatically, and the team's
  permission grants it write access to every row. That is why the admin area
  works without any special-casing in the app.
- Writes that must not be spoofed (a material's uploader, a message's author, a
  channel's creator) go through Next.js route handlers that take those values
  from the **session**, not from the request body.

---

## Setup — step by step

### Step 1 — Create the Appwrite project (free)

1. Go to <https://appwrite.io> → **Sign up** (or sign in).
2. Create a **project** (Education plan if you are eligible, otherwise Free).
3. Note the **Project ID** and the **API endpoint** (Overview → Endpoint).

### Step 2 — Create the API key

Project → **Overview → Integrations → API Keys → Create API key**.

Give it these scopes (they are the only ones the app needs):

```
databases.read   databases.write   tables.read   tables.write
files.read       files.write
teams.read       teams.write
users.read       users.write
sessions.write
```

Copy the **key secret** — you will need it for `APPWRITE_API_KEY`. It is a
server-side secret; never put it in a `NEXT_PUBLIC_` variable.

### Step 3 — Configure authentication

Project → **Auth** → **Settings**:

- **Session duration**: keep the default.
- **Email/Password** → enabled (it is on by default).
- Turn **off** any OAuth provider you do not need (the app is email + password
  only).
- **Enable email verification** → **off**. Appwrite's own SMTP is rate-limited
  and no mail is sent from this app anyway.
- Optionally, under **Auth → Security**, add the production domain to the
  allowed platforms once you have deployed.

### Step 4 — Provision the schema

One command creates the database, all seven tables, every column and index, both
storage buckets, the admins team and the default channels and subjects:

```bash
cp .env.example .env.local      # fill in endpoint, project id and API key first
node tools/appwrite-setup.mjs
```

The script is idempotent — run it again and it reports what already exists.
Expected output:

```
Database
  + database "khatmal"
Table profiles
  + table "profiles"
  + column "userId"
  …
Buckets
  + bucket "materials"
  + bucket "chat-images"
Team
  + team "admins"
Seed data
  + channel #general
  …
Done. Next: start the app and sign up — the first account becomes an admin.
```

### Step 5 — Fill in the environment variables

```dotenv
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://<region>.cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=<your project id>
APPWRITE_API_KEY=<your key secret>
INVITE_CODE=pick-a-code-your-friends-know
```

The defaults for the database id, bucket ids and team id match what the setup
script creates, so you only need the four values above.

### Step 6 — Install and run

```bash
npm install
npm run dev
```

Open <http://localhost:3000>.

### Step 7 — Become the admin

**The very first account that signs up becomes an admin** (it is added to the
`admins` team automatically). Sign up with your invite code, then look in the
left sidebar: an **Admin** entry appears.

---

## Running and testing locally

```bash
npm run dev        # dev server on http://localhost:3000
npm run build      # production build
npm run start      # serve the production build
npm run lint       # ESLint
npm run typecheck  # tsc --noEmit
```

### How to test each area

| Area | Steps |
| --- | --- |
| **Signup gate** | Go to `/signup` → submit with a wrong invite code → *"That invite code is not valid."* Then sign up with the right code. |
| **First user = admin** | With an empty project, the first signup sees the **Admin** nav item. Sign up a second account: it should **not** be an admin. |
| **Login** | Log out (user menu → Log out) and log back in. A member removed by an admin can no longer log in. |
| **Library — file** | Library → **Add item** → *Upload* → pick a PDF (≤ 20 MB) or an image (≤ 5 MB) → save. Open it: PDFs render in the native viewer, images open in the lightbox, and **Download** works. |
| **Library — image compression** | Upload a large photo (e.g. 4000 px wide). The file is resized to 1600 px and re-encoded before upload — check the stored size on the admin page. |
| **Library — link** | *Link* tab → paste a Google Drive / Mega URL → save. The detail page shows an "Open the shared link" card. |
| **Library — YouTube** | *YouTube* tab → paste `https://www.youtube.com/watch?v=dQw4w9WgXcQ` → press **Fetch**. The title appears automatically; save it and the player renders inline with a click-to-load thumbnail. |
| **Search / filter / sort** | Type in the search box (fulltext over title + tags + subject), then filter by type, subject and year and sort by newest/oldest/title. |
| **Delete removes the file** | Delete an uploaded item → the admin page's storage figure drops by the file size. |
| **Saved** | Hit the bookmark icon on any card → it appears under **Saved** and on the Home page. |
| **Chat** | Open **Chat**, pick a channel, send a message → it appears instantly in a second browser window (Realtime). |
| **Chat — image** | Attach an image → it is compressed, uploaded and shown inline; click it for the lightbox. |
| **Chat — YouTube link** | Paste a YouTube link in a message → a preview card appears under the text. |
| **Chat — attach library item** | Paperclip icon → pick an item → it posts as a card linking back to the library. |
| **Chat — older messages** | Scroll to the top of a busy channel → older messages load. |
| **Chat — unread dot** | Open a second browser as another member, send a message in a channel you are not in → the dot appears next to that channel. |
| **New channel** | Channels panel → **+** → create one; it is usable immediately. |
| **Admin — storage** | Open **Admin** → see bytes used per bucket and the progress bar. Near the limit, uploads are blocked and the red warning appears. |
| **Admin — moderation** | Admin → *Content moderation* → delete any library item or message. |
| **Admin — remove member** | Members → the remove icon next to a member. The account is deleted and their personal rows are cleaned up. |
| **Keepalive** | Visit `/api/keepalive` → `{"ok":true,…}`. Admin → *Keeping the project awake* → **Test keepalive**. |

---

## Deploying to Vercel (free)

1. **Push the code to GitHub**

   ```bash
   git init
   git add .
   git commit -m "Khatmal Coaching"
   git branch -M main
   git remote add origin https://github.com/<you>/khatmal-coaching.git
   git push -u origin main
   ```

2. **Import the repo into Vercel**

   - Go to <https://vercel.com/new> → import the GitHub repo.
   - Framework preset: **Next.js** (auto-detected).
   - Leave **Build Command** (`next build`) and **Output Directory** as they are.
   - Click **Deploy**.

3. **Add the environment variables**

   Vercel → your project → **Settings → Environment Variables** → add:

   | Name | Value | Environments |
   | --- | --- | --- |
   | `NEXT_PUBLIC_APPWRITE_ENDPOINT` | `https://<region>.cloud.appwrite.io/v1` | Production, Preview, Development |
   | `NEXT_PUBLIC_APPWRITE_PROJECT_ID` | your project id | Production, Preview, Development |
   | `APPWRITE_API_KEY` | your key secret | Production |
   | `INVITE_CODE` | your shared code | Production, Preview, Development |
   | `NEXT_PUBLIC_APP_URL` | `https://your-app.vercel.app` | Production |

   Then hit **Redeploy** — Vercel only bakes `NEXT_PUBLIC_*` variables in at
   build time, so changing them requires a rebuild.

4. **Point Appwrite at the deployment**

   - Appwrite Console → **Project → Overview → Platforms** → add a **Web App**
     platform with hostname `your-app.vercel.app` (this is what allows the
     browser to talk to Appwrite from that origin).
   - Appwrite → **Auth → Settings → Allowed origins / platforms**: add
     `https://your-app.vercel.app`.

### Keeping it free on Vercel Hobby

- One production deployment, no paid add-ons.
- Set `NEXT_PUBLIC_APP_URL` so the admin page can show the keepalive URL.
- If you ever exceed Vercel's Hobby limits, point the keepalive at a free
  scheduler such as **cron-job.org** or **UptimeRobot** instead.

---

## Keepalive: stopping Appwrite from pausing a free project

The **Education plan never pauses**. The **Free plan pauses after 7 days**
without activity and wakes up on the next request, which is slow and can break
things. Two things are set up for you:

**1. The route** — `GET /api/keepalive` performs the lightest possible call
(Appwrite's `/ping`):

```json
{ "ok": true, "region": "fra", "durationMs": 12 }
```

**2. The workflow** — `.github/workflows/keepalive.yml` pings it every 3 days
(`cron: "17 6 */3 * *"`), and can also be triggered manually from the Actions tab.

To activate it:

1. Push the repo to GitHub (the workflow file ships with it).
2. In the repo go to **Settings → Secrets and variables → Actions → New
   repository secret**:
   - Name: `KEEPALIVE_URL`
   - Value: `https://your-app.vercel.app/api/keepalive`
3. Done. You can verify it under **Actions → Keepalive → Run workflow**.

> The workflow is a no-op (exits 0) when the secret is missing, so nothing breaks
> if you forget to set it.

---

## Project structure

```
khatmal-coaching/
├─ .env.example                     # every env var, documented
├─ .github/workflows/keepalive.yml  # free scheduled keepalive
├─ eslint.config.mjs                # ESLint 9 flat config
├─ next.config.ts
├─ postcss.config.mjs               # Tailwind v4 (CSS-first, no tailwind.config.js)
├─ src/
│  ├─ proxy.ts                      # session guard (Next 16's "middleware")
│  ├─ app/
│  │  ├─ layout.tsx  page.tsx  globals.css  error.tsx
│  │  ├─ (auth)/login  (auth)/signup
│  │  ├─ (app)/home  library  library/[id]  chat  chat/[channelId]
│  │  │        saved  members  admin
│  │  └─ api/
│  │     ├─ auth/signup  auth/login  auth/logout  auth/session
│  │     ├─ materials  channels  saved  chat/messages  chat/read
│  │     └─ keepalive  storage/usage  youtube/oembed  admin/members
│  ├─ components/
│  │  ├─ ui/            # shadcn-style primitives
│  │  ├─ layout/        # sidebar, bottom nav, wordmark, user menu, offline banner
│  │  ├─ auth/  library/  chat/  home/  saved/  members/  admin/
│  ├─ lib/
│  │  ├─ appwrite/      # config, permissions, server + browser clients, queries, data
│  │  ├─ constants/limits.ts   # every free-tier limit in one place
│  │  ├─ file-validation.ts    # shared client + server upload rules
│  │  ├─ image-compress.ts     # client-side resize/re-encode
│  │  ├─ youtube.ts            # URL parsing, thumbnails, embed URLs
│  │  └─ utils.ts  env.ts
│  └─ types/appwrite.ts
└─ tools/                      # local dev fixtures (not used in production)
   ├─ appwrite-setup.mjs      # creates the whole Appwrite schema
   ├─ mock-appwrite.mjs       # fake Appwrite API for offline UI work
   └─ screenshot.mjs          # captures every screen through headless Edge
```

### Local dev fixtures (optional)

`tools/` holds helpers that are handy before you have an Appwrite project. None
of them are used by the app or the deployment:

```bash
# Provision the Appwrite schema (needs a real project + API key)
node tools/appwrite-setup.mjs

# Fake Appwrite API with seed data on http://127.0.0.1:54321/v1
node tools/mock-appwrite.mjs

# Capture every screen with headless Edge (needs the app running)
node tools/screenshot.mjs http://127.0.0.1:3000 ./shots
```

To use the mock, point `.env.local` at it:

```dotenv
NEXT_PUBLIC_APPWRITE_ENDPOINT=http://127.0.0.1:54321/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=mock-project
APPWRITE_API_KEY=mock-key
```

Log in with any email and password — the mock accepts everything.

---

## Troubleshooting

**"Appwrite is not configured" on every page**
`NEXT_PUBLIC_APPWRITE_ENDPOINT` / `NEXT_PUBLIC_APPWRITE_PROJECT_ID` are missing.
Copy `.env.example` to `.env.local`, fill them in, and restart the dev server.

**Signup says the invite code is not valid**
`INVITE_CODE` is set on the server but you typed something else. The comparison
is case-insensitive, but it is read from the server at request time — restart the
dev server after changing it.

**Signup creates the account but you are not signed in**
The signup route creates the Appwrite session itself and sets the cookie. If the
cookie is missing, check that your browser is not blocking third-party cookies
and that you are on `localhost` (the cookie is `SameSite=Lax`).

**Uploads fail with "mime type not supported" or "file size exceeded"**
The bucket's `maximumFileSize` / `allowedFileExtensions` are stricter than
expected. Re-run `node tools/appwrite-setup.mjs`, which resets them.

**The library is empty / "Could not load the library"**
The browser could not reach Appwrite. Add your Vercel domain under
**Appwrite → Project → Overview → Platforms**, and make sure
`NEXT_PUBLIC_APPWRITE_ENDPOINT` includes the `/v1` suffix.

**Realtime messages do not arrive**
Check that the deployment is allowed to open WebSockets to Appwrite, and that
the session cookie is present when the page subscribes. The channel is
`tablesdb.<databaseId>.tables.messages.rows`.

**"You cannot delete this file"**
Appwrite denies deleting a file you did not upload. Only the uploader or an
admin can remove a file — that is the intended behaviour.

**The admin page shows "Could not read storage usage"**
The API key is missing the `files.read` scope. Update the key and redeploy.

**Appwrite paused my project (Free plan)**
Hit `/api/keepalive` once to wake it, then set up the GitHub Actions secret so
it does not happen again.

---

## Cost summary

| Service | Plan | Cost |
| --- | --- | --- |
| Vercel | Hobby | $0 |
| Appwrite | Education (or Free) | $0 |
| GitHub Actions | Free tier | $0 |
| Google Fonts (Inter) | Free | $0 |
| YouTube oEmbed | Public endpoint | $0 |
| **Total** | | **$0** |

No credit card is required at any point.
