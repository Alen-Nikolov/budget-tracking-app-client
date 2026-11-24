import type { AuthResponse } from "./types";

export const ACCESS_COOKIE = "bt_access";
export const REFRESH_COOKIE = "bt_refresh";
export const ROLE_COOKIE = "bt_role";
export const EMAIL_COOKIE = "bt_email";

const REFRESH_MAX_AGE = 90 * 24 * 60 * 60;

const base = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

/** Cookie definitions for a fresh AuthResponse. Refresh tokens are single use, so always store the new one. */
export function sessionCookies(auth: AuthResponse) {
  // Expire the access cookie slightly early so the proxy refreshes before the API rejects it.
  const accessAge = Math.max(auth.accessTokenExpiresInSeconds - 30, 1);
  return [
    { name: ACCESS_COOKIE, value: auth.accessToken, options: { ...base, maxAge: accessAge } },
    { name: REFRESH_COOKIE, value: auth.refreshToken, options: { ...base, maxAge: REFRESH_MAX_AGE } },
    { name: ROLE_COOKIE, value: auth.role, options: { ...base, maxAge: REFRESH_MAX_AGE } },
    { name: EMAIL_COOKIE, value: auth.email, options: { ...base, maxAge: REFRESH_MAX_AGE } },
  ];
}

export const SESSION_COOKIE_NAMES = [ACCESS_COOKIE, REFRESH_COOKIE, ROLE_COOKIE, EMAIL_COOKIE];
