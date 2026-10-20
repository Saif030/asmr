import { NextResponse, type NextRequest } from "next/server";

import { projectId, sessionCookieName } from "@/lib/appwrite/config";

/**
 * Route guard.
 *
 * The Appwrite session lives in an httpOnly cookie, so the check here is a
 * cheap cookie test — the real validation happens in the app layout, which
 * asks Appwrite who the session belongs to.
 *
 * Next 16 renamed `middleware.ts` to `proxy.ts`; the exported function is the
 * same.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAuthRoute = pathname === "/login" || pathname === "/signup";
  const isAppRoute =
    pathname.startsWith("/home") ||
    pathname.startsWith("/library") ||
    pathname.startsWith("/chat") ||
    pathname.startsWith("/saved") ||
    pathname.startsWith("/members") ||
    pathname.startsWith("/admin");

  const hasSession = Boolean(request.cookies.get(sessionCookieName())?.value);

  if (!hasSession && isAppRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (hasSession && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/home";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Skip static assets and image optimisation routes.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};

export { projectId };
