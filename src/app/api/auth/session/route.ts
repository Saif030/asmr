import { NextResponse } from "next/server";
import { Account } from "node-appwrite";
import { cookies } from "next/headers";

import { sessionCookieName } from "@/lib/appwrite/config";
import { createSessionClient } from "@/lib/appwrite/server";

/**
 * Hands the browser the session secret so the Web SDK can talk to Appwrite
 * directly and receive Realtime events. The secret itself never leaves the
 * httpOnly cookie on the server.
 */
export async function GET() {
  const cookieStore = await cookies();
  const secret = cookieStore.get(sessionCookieName())?.value;

  if (!secret) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const client = await createSessionClient();
  const account = new Account(client);

  try {
    const user = await account.get();
    return NextResponse.json({
      secret,
      user: { id: user.$id, name: user.name, email: user.email },
    });
  } catch {
    return NextResponse.json({ error: "Session expired." }, { status: 401 });
  }
}
