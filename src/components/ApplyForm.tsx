"use client";

import { useActionState } from "react";
import { applyToRepresent, type FormState } from "@/lib/actions";
import type { Category } from "@/lib/categories";

const initial: FormState = {};

export default function ApplyForm({
  choices,
  current,
}: {
  choices: Category[];
  current?: { statement: string; categoryKey: string };
}) {
  const [state, action, pending] = useActionState(applyToRepresent, initial);
  const editing = !!current;

  return (
    <form action={action} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="categoryKey" className="text-sm font-medium">
          What will you represent?
        </label>
        <select
          id="categoryKey"
          name="categoryKey"
          defaultValue={current?.categoryKey ?? "general"}
          className="field"
        >
          {choices.map((c) => (
            <option key={c.key} value={c.key}>
              {c.emoji} {c.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="statement" className="text-sm font-medium">
          Your statement
        </label>
        <textarea
          id="statement"
          name="statement"
          rows={4}
          maxLength={600}
          defaultValue={current?.statement ?? ""}
          placeholder="Why should people trust you to speak for them? What will you push for?"
          className="field resize-y"
        />
      </div>

      {state.error ? (
        <p className="rounded-lg bg-accent/10 px-3 py-2 text-sm text-accent-strong">
          {state.error}
        </p>
      ) : null}
      {state.ok ? (
        <p className="rounded-lg bg-accent/10 px-3 py-2 text-sm text-accent-strong">
          {editing ? "Candidacy updated." : "You're on the list. Good luck!"}
        </p>
      ) : null}

      <div className="flex justify-end">
        <button type="submit" disabled={pending} className="btn-primary">
          {pending
            ? "Saving…"
            : editing
              ? "Update candidacy"
              : "Add me to the list"}
        </button>
      </div>
    </form>
  );
}
