/**
 * YouTube helpers — no API key required.
 *
 * Metadata comes from the free oEmbed endpoint
 * (https://www.youtube.com/oembed?url=...) and thumbnails from img.youtube.com.
 * Only the video/playlist id is needed to embed the player.
 */

export type YouTubeRef = {
  id: string;
  type: "video" | "playlist";
  url: string;
};

const VIDEO_ID = /^[a-zA-Z0-9_-]{11}$/;
const PLAYLIST_ID = /^[a-zA-Z0-9_-]{10,}$/;

const HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "music.youtube.com",
  "youtu.be",
  "www.youtu.be",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
]);

/** Parses any common YouTube link into a canonical {id, type} reference. */
export function parseYouTubeUrl(input: string): YouTubeRef | null {
  const raw = input.trim();
  if (!raw) return null;

  let url: URL;
  try {
    url = new URL(raw.includes("://") ? raw : `https://${raw}`);
  } catch {
    return null;
  }

  const host = url.hostname.toLowerCase();
  if (!HOSTS.has(host)) return null;

  // youtu.be/<videoId>
  if (host.endsWith("youtu.be")) {
    const id = url.pathname.slice(1).split("/")[0];
    if (VIDEO_ID.test(id)) {
      return { id, type: "video", url: `https://www.youtube.com/watch?v=${id}` };
    }
    return null;
  }

  // /watch?v=<videoId>
  const v = url.searchParams.get("v");
  if (v && VIDEO_ID.test(v)) {
    return { id: v, type: "video", url: `https://www.youtube.com/watch?v=${v}` };
  }

  // /playlist?list=<playlistId>
  const list = url.searchParams.get("list");
  if (list && PLAYLIST_ID.test(list)) {
    return { id: list, type: "playlist", url: `https://www.youtube.com/playlist?list=${list}` };
  }

  // /shorts/<videoId> and /embed/<videoId>
  const segments = url.pathname.split("/").filter(Boolean);
  if (segments.length >= 2 && ["shorts", "embed", "live", "v"].includes(segments[0])) {
    const id = segments[1];
    if (VIDEO_ID.test(id)) {
      return { id, type: "video", url: `https://www.youtube.com/watch?v=${id}` };
    }
  }

  return null;
}

export function youtubeThumbnail(ref: YouTubeRef): string {
  if (ref.type === "playlist") {
    return `https://img.youtube.com/vi/${ref.id}/hqdefault.jpg`;
  }
  return `https://img.youtube.com/vi/${ref.id}/hqdefault.jpg`;
}

/** Privacy-enhanced embed URL for the inline player. */
export function youtubeEmbedUrl(ref: YouTubeRef): string {
  if (ref.type === "playlist") {
    return `https://www.youtube-nocookie.com/embed?listType=playlist&list=${ref.id}`;
  }
  return `https://www.youtube-nocookie.com/embed/${ref.id}`;
}

/** Finds every YouTube link inside a free-text chat message. */
export function extractYouTubeRefs(text: string): YouTubeRef[] {
  const found: YouTubeRef[] = [];
  const seen = new Set<string>();

  const urlPattern = /https?:\/\/[^\s<>"']+/gi;
  for (const match of text.match(urlPattern) ?? []) {
    const ref = parseYouTubeUrl(match.replace(/[),.]+$/, ""));
    if (!ref) continue;
    const key = `${ref.type}:${ref.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    found.push(ref);
  }

  return found;
}

/** Any http(s) link inside a message body. */
export function extractLinks(text: string): string[] {
  const matches = text.match(/https?:\/\/[^\s<>"']+/gi) ?? [];
  return matches.map((m) => m.replace(/[),.]+$/, ""));
}
