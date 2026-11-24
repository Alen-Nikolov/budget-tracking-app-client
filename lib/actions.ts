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
      body: JSON.stringify(payload),
      cache: "no-store",
    });
  } catch {
    return { message: "Cannot reach the API. Is the backend running on " + API_URL + "?", email };
  }

  if (!res.ok) {
    const err = await toApiException(res);
    let message = err.message;
    if (res.status === 429) {
      const wait = res.headers.get("Retry-After");
      message = `Too many failed attempts.${wait ? ` Try again in ${wait}s.` : ""}`;
    }
    return { message, fieldErrors: err.fieldErrors ?? undefined, email };
  }

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
