"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { API_URL, toApiException } from "./api";
import { REFRESH_COOKIE, SESSION_COOKIE_NAMES, sessionCookies } from "./session";
import type { AuthResponse } from "./types";

export interface AuthState {
  message?: string;
  fieldErrors?: Record<string, string>;
  email?: string;
}

async function authenticate(path: "/login" | "/register", payload: object, email: string): Promise<AuthState> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, ...(path === "/register" ? { client: "WEB" } : {}) }),
      cache: "no-store",
    });
  } catch {
    return { message: "Cannot reach the API. Is the backend running on " + API_URL + "?", email };
  }

  if (!res.ok) {
    const err = await toApiException(res);
    if (err.code === "EMAIL_NOT_VERIFIED") redirect(`/check-your-email?email=${encodeURIComponent(email)}&unverified=1`);
    let message = err.message;
    if (res.status === 429) {
      const wait = res.headers.get("Retry-After");
      message = `Too many failed attempts.${wait ? ` Try again in ${wait}s.` : ""}`;
    }
    return { message, fieldErrors: err.fieldErrors ?? undefined, email };
  }

  // Registration issues no tokens: the user must verify their email first.
  if (path === "/register") redirect(`/check-your-email?email=${encodeURIComponent(email)}`);

  const auth = (await res.json()) as AuthResponse;
  const jar = await cookies();
  sessionCookies(auth).forEach((c) => jar.set(c.name, c.value, c.options));
  redirect("/dashboard");
}

export async function loginAction(_: AuthState, form: FormData): Promise<AuthState> {
  const email = String(form.get("email") ?? "");
  return authenticate("/login", { email, password: String(form.get("password") ?? "") }, email);
}

export async function registerAction(_: AuthState, form: FormData): Promise<AuthState> {
  const email = String(form.get("email") ?? "");
  return authenticate(
    "/register",
    {
      email,
      password: String(form.get("password") ?? ""),
      confirmPassword: String(form.get("confirmPassword") ?? ""),
    },
    email,
  );
}

export async function logoutAction() {
  const jar = await cookies();
  const refreshToken = jar.get(REFRESH_COOKIE)?.value;
  if (refreshToken) {
    // Best effort: revoke server-side, but always clear the local session.
    await fetch(`${API_URL}/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    }).catch(() => null);
  }
  SESSION_COOKIE_NAMES.forEach((n) => jar.delete(n));
  redirect("/login");
}

export interface ResendState {
  message?: string;
  error?: string;
  sentAt?: number;
}

export async function resendAction(_: ResendState, form: FormData): Promise<ResendState> {
  const email = String(form.get("email") ?? "").trim();
  if (!email) return { error: "Enter your email address." };
  try {
    const res = await fetch(`${API_URL}/resend-verification`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, client: "WEB" }),
      cache: "no-store",
    });
    if (res.status === 400) {
      const err = await toApiException(res);
      return { error: err.fieldErrors?.email ?? err.message };
    }
    if (!res.ok) return { error: "Could not send the email. Please try again." };
  } catch {
    return { error: "Cannot reach the API. Is the backend running?" };
  }
  // The API always answers 202 and never reveals whether the account exists.
  return { message: "If that account is awaiting verification, a new link is on its way.", sentAt: Date.now() };
}
