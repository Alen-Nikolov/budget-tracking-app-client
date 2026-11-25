"use client";

import { useActionState, useEffect, useState } from "react";
import { resendAction, type ResendState } from "@/lib/actions";

const COOLDOWN = 60; // the API accepts one email per 60 s per account and silently ignores extras

export default function ResendForm({ email }: { email?: string }) {
  const [state, action, pending] = useActionState(resendAction, {} as ResendState);
  const [left, setLeft] = useState(0);

  useEffect(() => {
    if (!state.sentAt) return;
    setLeft(COOLDOWN);
    const id = setInterval(() => setLeft((s) => (s <= 1 ? (clearInterval(id), 0) : s - 1)), 1000);
    return () => clearInterval(id);
  }, [state.sentAt]);

  return (
    <form action={action}>
      {email ? (
        <input type="hidden" name="email" value={email} />
      ) : (
        <label>
          Email
          <input name="email" type="email" required autoComplete="email" />
        </label>
      )}
      {state.error && <p className="error">{state.error}</p>}
      {state.message && <p className="notice">{state.message}</p>}
      <button className="primary" disabled={pending || left > 0}>
        {pending ? "Sending…" : left > 0 ? `Resend available in ${left}s` : "Resend verification email"}
      </button>
    </form>
  );
}
