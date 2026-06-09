"use client";

import { useActionState, useEffect, useRef } from "react";
import { createAppeal, type FormState } from "@/lib/actions";

const initial: FormState = {};

export default function AppealComposer() {
  const [state, action, pending] = useActionState(createAppeal, initial);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="card flex flex-col gap-3 p-5">
      <h2 className="text-sm font-semibold tracking-tight text-muted">
        Raise an appeal
      </h2>
      <input
        name="title"
        placeholder="Title — what are you calling for?"
        maxLength={120}
        className="field font-medium"
      />
      <textarea
        name="body"
        placeholder="Explain your appeal, what happened, and what you're demanding…"
        rows={4}
        maxLength={5000}
        className="field resize-y"
      />
      <input
        name="tags"
        placeholder="Tags (comma separated, e.g. roads, safety)"
        className="field"
      />
      {state.error ? (
        <p className="rounded-lg bg-accent/10 px-3 py-2 text-sm text-accent-strong">
          {state.error}
        </p>
      ) : null}
      <div className="flex justify-end">
        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? "Posting…" : "Post appeal"}
        </button>
      </div>
    </form>
  );
}
