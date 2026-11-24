"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction, type AuthState } from "@/lib/actions";

const initial: AuthState = {};

export default function LoginForm({ expired }: { expired: boolean }) {
  const [state, action, pending] = useActionState(loginAction, initial);
  const fe = state.fieldErrors ?? {};

  return (
    <div className="card auth">
      <h1>Log in</h1>
      {expired && <p className="notice">Your session expired. Please log in again.</p>}
      {state.message && <p className="error">{state.message}</p>}
      <form action={action}>
        <label>
          Email
          <input name="email" type="email" required autoComplete="email" defaultValue={state.email} />
          {fe.email && <span className="error">{fe.email}</span>}
        </label>
        <label>
          Password
          <input name="password" type="password" required minLength={8} maxLength={72} autoComplete="current-password" />
          {fe.password && <span className="error">{fe.password}</span>}
        </label>
        <button className="primary" disabled={pending}>{pending ? "Please wait…" : "Log in"}</button>
      </form>
      <p className="hint">No account? <Link href="/register">Register</Link></p>
    </div>
  );
}
