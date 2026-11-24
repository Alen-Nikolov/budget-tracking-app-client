"use client";

import Link from "next/link";
import { useActionState } from "react";
import { registerAction, type AuthState } from "@/lib/actions";

const initial: AuthState = {};

export default function RegisterForm() {
  const [state, action, pending] = useActionState(registerAction, initial);
  const fe = state.fieldErrors ?? {};

  return (
    <div className="card auth">
      <h1>Register</h1>
      {state.message && <p className="error">{state.message}</p>}
      <form action={action}>
        <label>
          Email
          <input name="email" type="email" required autoComplete="email" defaultValue={state.email} />
          {fe.email && <span className="error">{fe.email}</span>}
        </label>
        <label>
          Password
          <input name="password" type="password" required minLength={8} maxLength={72} autoComplete="new-password" />
          {fe.password && <span className="error">{fe.password}</span>}
        </label>
        <label>
          Confirm password
          <input name="confirmPassword" type="password" required minLength={8} maxLength={72} autoComplete="new-password" />
          {fe.confirmPassword && <span className="error">{fe.confirmPassword}</span>}
        </label>
        <button className="primary" disabled={pending}>{pending ? "Please wait…" : "Create account"}</button>
      </form>
      <p className="hint">Already have an account? <Link href="/login">Log in</Link></p>
    </div>
  );
}
