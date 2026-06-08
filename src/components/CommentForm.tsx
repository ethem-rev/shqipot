"use client";

import { useActionState, useEffect, useRef } from "react";
import { createComment, type FormState } from "@/lib/actions";

const initial: FormState = {};

export default function CommentForm({
  appealId,
  parentId,
  placeholder = "Add your voice…",
  compact = false,
  autoFocus = false,
  onDone,
}: {
  appealId: string;
  parentId?: string;
  placeholder?: string;
  compact?: boolean;
  autoFocus?: boolean;
  onDone?: () => void;
}) {
  const [state, action, pending] = useActionState(createComment, initial);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
      onDone?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-2">
      <input type="hidden" name="appealId" value={appealId} />
      {parentId ? (
        <input type="hidden" name="parentId" value={parentId} />
      ) : null}
      <textarea
        name="body"
        placeholder={placeholder}
        rows={compact ? 2 : 3}
        maxLength={2000}
        autoFocus={autoFocus}
        className="field resize-y"
      />
      {state.error ? (
        <p className="rounded-lg bg-accent/10 px-3 py-2 text-sm text-accent-strong">
          {state.error}
        </p>
      ) : null}
      <div className="flex justify-end gap-2">
        {onDone ? (
          <button
            type="button"
            onClick={onDone}
            className="btn-secondary btn-sm"
          >
            Cancel
          </button>
        ) : null}
        <button
          type="submit"
          disabled={pending}
          className={`btn-primary ${compact ? "btn-sm" : ""}`}
        >
          {pending ? "Sending…" : parentId ? "Reply" : "Comment"}
        </button>
      </div>
    </form>
  );
}
