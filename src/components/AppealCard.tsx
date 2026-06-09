"use client";

import { useActionState, useEffect, useState } from "react";
import Avatar from "./Avatar";
import CategoryChip from "./CategoryChip";
import VoteButton from "./VoteButton";
import { deleteAppeal, updateAppeal, type FormState } from "@/lib/actions";
import { relativeTime } from "@/lib/format";

const initial: FormState = {};

export default function AppealCard({
  id,
  title,
  body,
  authorHandle,
  createdAt,
  editedAt,
  isOwner,
  categoryKey,
  tags,
  score,
  userVote,
  loggedIn,
}: {
  id: string;
  title: string;
  body: string;
  authorHandle: string;
  createdAt: number;
  editedAt?: number;
  isOwner: boolean;
  categoryKey: string;
  tags: string[];
  score: number;
  userVote: number;
  loggedIn: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [state, action, pending] = useActionState(updateAppeal, initial);

  useEffect(() => {
    if (state.ok) setEditing(false);
  }, [state]);

  return (
    <article className="card flex flex-col gap-4 p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 text-sm">
          <Avatar handle={authorHandle} size={32} />
          <span className="font-medium">@{authorHandle}</span>
          <span className="text-muted">
            · {relativeTime(createdAt)}
            {editedAt ? " · edited" : ""}
          </span>
        </div>
        {isOwner && !editing ? (
          <div className="flex items-center gap-3 text-xs">
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="font-medium text-muted transition hover:text-accent"
            >
              Edit
            </button>
            <form
              action={deleteAppeal}
              onSubmit={(e) => {
                if (!confirm("Delete this appeal and all its comments?")) {
                  e.preventDefault();
                }
              }}
            >
              <input type="hidden" name="id" value={id} />
              <button
                type="submit"
                className="font-medium text-muted transition hover:text-accent"
              >
                Delete
              </button>
            </form>
          </div>
        ) : null}
      </div>

      {editing ? (
        <form action={action} className="flex flex-col gap-3">
          <input type="hidden" name="id" value={id} />
          <input
            name="title"
            defaultValue={title}
            maxLength={120}
            className="field font-medium"
          />
          <textarea
            name="body"
            defaultValue={body}
            rows={5}
            maxLength={5000}
            className="field resize-y"
          />
          <input
            name="tags"
            defaultValue={tags.join(", ")}
            placeholder="Tags (comma separated)"
            className="field"
          />
          {state.error ? (
            <p className="rounded-md bg-accent/10 px-3 py-2 text-sm text-accent-strong">
              {state.error}
            </p>
          ) : null}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="btn-secondary btn-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending}
              className="btn-primary btn-sm"
            >
              {pending ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      ) : (
        <div className="flex gap-4">
          <VoteButton
            appealId={id}
            score={score}
            userVote={userVote}
            loggedIn={loggedIn}
          />
          <div className="min-w-0 flex-1">
            <div className="mb-2">
              <CategoryChip categoryKey={categoryKey} size="sm" />
            </div>
            <h1 className="text-2xl font-semibold leading-tight tracking-tight">
              {title}
            </h1>
            <p className="mt-3 whitespace-pre-wrap text-[15px] leading-relaxed">
              {body}
            </p>
            {tags.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {tags.map((t) => (
                  <span key={t} className="tag">
                    {t}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </article>
  );
}
