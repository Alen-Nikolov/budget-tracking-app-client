import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ACCESS_COOKIE } from "./session";
import type { ApiError, Category, ExpenseSearch, Stats } from "./types";

export const API_URL = process.env.API_URL ?? "http://localhost:8080";

export class ApiException extends Error {
  constructor(
    public status: number,
    message: string,
    public fieldErrors?: Record<string, string> | null,
    public code?: string | null,
  ) {
    super(message);
  }
}

/** Parse an error response. 401/403 may have an empty body, so never assume JSON. */
export async function toApiException(res: Response): Promise<ApiException> {
  let body: ApiError = {};
  try {
    body = (await res.json()) as ApiError;
  } catch {
    /* empty body */
  }
  return new ApiException(res.status, body.message ?? res.statusText, body.fieldErrors, body.code);
}

async function authed<T>(path: string): Promise<T> {
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (!token) redirect("/login");

  const res = await fetch(`${API_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  // The proxy refreshes expired tokens; a 401 here means the session is truly dead.
  if (res.status === 401) redirect("/login?expired=1");
  if (!res.ok) throw await toApiException(res);
  return (await res.json()) as T;
}

export const getStats = () => authed<Stats>("/admin/stats");
export const getCategories = () => authed<Category[]>("/category");

export function searchExpenses(from: string, to: string, categoryIds: number[]) {
  const params = new URLSearchParams({ from, to });
  categoryIds.forEach((id) => params.append("categoryIds", String(id)));
  return authed<ExpenseSearch>(`/expenses?${params}`);
}
