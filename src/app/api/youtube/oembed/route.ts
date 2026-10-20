import { NextResponse } from "next/server";

import { parseYouTubeUrl } from "@/lib/youtube";

/**
 * Free YouTube metadata via the public oEmbed endpoint.
 * No API key, no paid service — https://www.youtube.com/oembed
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawUrl = searchParams.get("url") ?? "";

  const ref = parseYouTubeUrl(rawUrl);
  if (!ref) {
    return NextResponse.json(
      { error: "That does not look like a YouTube video or playlist link." },
      { status: 400 },
    );
  }

  const endpoint = new URL("https://www.youtube.com/oembed");
  endpoint.searchParams.set("url", ref.url);
  endpoint.searchParams.set("format", "json");

  try {
    const response = await fetch(endpoint, {
      // oEmbed responses are stable per URL; a short cache avoids repeat calls.
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "YouTube could not resolve that link. Check it is public." },
        { status: 404 },
      );
    }

    const data = (await response.json()) as {
      title?: string;
      author_name?: string;
      thumbnail_url?: string;
      thumbnail_width?: number;
      thumbnail_height?: number;
      provider_name?: string;
    };

    return NextResponse.json({
      id: ref.id,
      type: ref.type,
      title: data.title ?? "YouTube video",
      author: data.author_name ?? "",
      thumbnailUrl: data.thumbnail_url ?? null,
      provider: data.provider_name ?? "YouTube",
      url: ref.url,
    });
  } catch {
    return NextResponse.json(
      { error: "Could not reach YouTube. Check your connection and try again." },
      { status: 502 },
    );
  }
}
