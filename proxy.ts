import { NextResponse, type NextRequest } from "next/server";
import { ACCESS_COOKIE, REFRESH_COOKIE, SESSION_COOKIE_NAMES, sessionCookies } from "@/lib/session";
import type { AuthResponse } from "@/lib/types";

const API_URL = process.env.API_URL ?? "http://localhost:8080";

/**
 * Keeps the session alive: when the access cookie has expired but a refresh token exists,
 * call POST /refresh and store BOTH new tokens (the old refresh token is single use).
 */
export async function proxy(req: NextRequest) {
  const access = req.cookies.get(ACCESS_COOKIE)?.value;
  const refresh = req.cookies.get(REFRESH_COOKIE)?.value;
  const path = req.nextUrl.pathname;

  if (!access && refresh) {
    const res = await fetch(`${API_URL}/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: refresh }),
    }).catch(() => null);

    if (res?.ok) {
      const auth = (await res.json()) as AuthResponse;
      const cookies = sessionCookies(auth);

      // Make the new token visible to the page render in this same request...
      const headers = new Headers(req.headers);
      const merged = new Map(req.cookies.getAll().map((c) => [c.name, c.value]));
      cookies.forEach((c) => merged.set(c.name, c.value));
      headers.set("cookie", [...merged].map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join("; "));

      // ...and persist it in the browser.
      const next = NextResponse.next({ request: { headers } });
      cookies.forEach((c) => next.cookies.set(c.name, c.value, c.options));
      return next;
    }

    // Refresh token rejected (expired / reused): drop the session.
    const out = NextResponse.redirect(new URL("/login?expired=1", req.url));
    SESSION_COOKIE_NAMES.forEach((n) => out.cookies.delete(n));
    return out;
  }

  if (!access && path.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  if (access && (path === "/login" || path === "/register") && !req.nextUrl.searchParams.has("expired")) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ["/dashboard/:path*", "/login", "/register"] };
