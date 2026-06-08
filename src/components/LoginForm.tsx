"use client";

import { useActionState } from "react";
import {
  continueAnonymously,
  loginWithUsername,
  type FormState,
} from "@/lib/actions";

const initial: FormState = {};

export default function LoginForm() {
  const [state, action, pending] = useActionState(loginWithUsername, initial);

  return (
    <div className="flex flex-col gap-7">
      <form action={action} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="handle" className="text-sm font-medium">
            Username
          </label>
          <input
            id="handle"
            name="handle"
            autoComplete="username"
            placeholder="e.g. brave-voice"
            className="field"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="passphrase" className="text-sm font-medium">
            Passphrase
          </label>
          <input
            id="passphrase"
            name="passphrase"
            type="password"
            autoComplete="current-password"
            placeholder="at least 6 characters"
            className="field"
          />
          <p className="text-xs leading-relaxed text-muted">
            New username? It&apos;s created on first login. Returning? Use the
            same passphrase to sign back in.
          </p>
        </div>

        {state.error ? (
          <p className="rounded-lg bg-accent/10 px-3 py-2 text-sm text-accent-strong">
            {state.error}
          </p>
        ) : null}

        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? "Working…" : "Continue with username"}
        </button>
      </form>

      <div className="flex items-center gap-3 text-xs font-medium uppercase tracking-wider text-muted">
        <span className="h-px flex-1 bg-border" />
        or
        <span className="h-px flex-1 bg-border" />
      </div>

      <form action={continueAnonymously} className="flex flex-col gap-2">
        <button type="submit" className="btn-secondary w-full">
          Generate an anonymous ID
        </button>
        <p className="text-xs leading-relaxed text-muted">
          No name, no passphrase. You stay signed in on this device only — clear
          your cookies and the identity is gone.
        </p>
      </form>
    </div>
  );
}
