import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/appwrite/server";

export const dynamic = "force-dynamic";

/**
 * Keepalive probe.
 *
 * Appwrite pauses free projects after 7 days without activity (the Education
 * plan never pauses, so this is a safety net). The route issues the lightest
 * possible call — Appwrite's /ping — so the project stays warm.
 * The GitHub Actions workflow in .github/workflows/keepalive.yml calls it
 * every 3 days.
 */
export async function GET() {
  const startedAt = Date.now();

  try {
    const client = createAdminClient();
    const result = (await client.ping()) as { region?: string } | undefined;

    return NextResponse.json({
      ok: true,
      region: result?.region ?? null,
      durationMs: Date.now() - startedAt,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: String((error as Error)?.message ?? "Keepalive failed."),
      },
      { status: 500 },
    );
  }
}
