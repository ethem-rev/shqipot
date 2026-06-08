"use client";

import { useActionState, useEffect, useState } from "react";
import Avatar from "./Avatar";
import CommentForm from "./CommentForm";
import { deleteComment, updateComment, type FormState } from "@/lib/actions";
import { relativeTime } from "@/lib/format";
import type { Comment } from "@/lib/types";

export type CommentNode = Comment & {
  authorHandle: string;
  children: CommentNode[];
  /** total number of descendant comments in this subtree */
  descendants: number;
};

const initial: FormState = {};
const actionCls = "font-medium text-muted transition hover:text-accent";

export default function CommentItem({
  node,
  appealId,
  canReply,
  currentUserId,
}: {
  node: CommentNode;
  appealId: string;
  canReply: boolean;
  currentUserId?: string;
}) {
  const [replying, setReplying] = useState(false);
  const [editing, setEditing] = useState(false);
  // Long threads start collapsed to keep the page tidy.
  const [collapsed, setCollapsed] = useState(node.descendants >= 5);

  const [editState, editAction, editPending] = useActionState(
    updateComment,
    initial,
  );

  useEffect(() => {
    if (editState.ok) setEditing(false);
  }, [editState]);

  const isOwner =
    !!currentUserId && node.authorId === currentUserId && !node.deleted;
  const hasChildren = node.children.length > 0;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-3">
        {node.deleted ? (
          <span
            aria-hidden
            className="inline-block shrink-0 rounded-full bg-surface-2"
            style={{ width: 34, height: 34 }}
          />
        ) : (
          <Avatar handle={node.authorHandle} size={34} />
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 text-sm">
            <span className="font-medium">
              {node.deleted ? (
                <span className="text-muted">[deleted]</span>
              ) : (
                `@${node.authorHandle}`
              )}
            </span>
            <span className="text-muted">
              {relativeTime(node.createdAt)}
              {node.editedAt && !node.deleted ? " · edited" : ""}
            </span>
          </div>

          {editing ? (
            <form action={editAction} className="mt-2 flex flex-col gap-2">
              <input type="hidden" name="id" value={node.id} />
              <textarea
                name="body"
                defaultValue={node.body}
                rows={3}
                maxLength={2000}
                autoFocus
                className="field resize-y"
              />
              {editState.error ? (
                <p className="rounded-lg bg-accent/10 px-3 py-2 text-sm text-accent-strong">
                  {editState.error}
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
                  disabled={editPending}
                  className="btn-primary btn-sm"
                >
                  {editPending ? "Saving…" : "Save"}
                </button>
              </div>
            </form>
          ) : (
            <p className="mt-1 whitespace-pre-wrap break-words text-[15px] leading-relaxed">
              {node.deleted ? (
                <span className="text-muted italic">comment deleted</span>
              ) : (
                node.body
              )}
            </p>
          )}

          {!editing ? (
            <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs">
              {canReply && !node.deleted && !replying ? (
                <button
                  type="button"
                  onClick={() => setReplying(true)}
                  className={actionCls}
                >
                  Reply
                </button>
              ) : null}
              {isOwner ? (
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className={actionCls}
                >
                  Edit
                </button>
              ) : null}
              {isOwner ? (
                <form
                  action={deleteComment}
                  onSubmit={(e) => {
                    if (!confirm("Delete this comment?")) e.preventDefault();
                  }}
                >
                  <input type="hidden" name="id" value={node.id} />
                  <button type="submit" className={actionCls}>
                    Delete
                  </button>
                </form>
              ) : null}
              {hasChildren ? (
                <button
                  type="button"
                  onClick={() => setCollapsed((c) => !c)}
                  className={actionCls}
                >
                  {collapsed
                    ? `Show ${node.descendants} ${
                        node.descendants === 1 ? "reply" : "replies"
                      }`
                    : "Hide replies"}
                </button>
              ) : null}
            </div>
          ) : null}

          {replying ? (
            <div className="mt-3">
              <CommentForm
                appealId={appealId}
                parentId={node.id}
                compact
                autoFocus
                placeholder={`Reply to @${node.authorHandle}…`}
                onDone={() => setReplying(false)}
              />
            </div>
          ) : null}
        </div>
      </div>

      {hasChildren && !collapsed ? (
        <div className="ml-4 flex flex-col gap-5 border-l border-border pl-4 sm:ml-5 sm:pl-5">
          {node.children.map((child) => (
            <CommentItem
              key={child.id}
              node={child}
              appealId={appealId}
              canReply={canReply}
              currentUserId={currentUserId}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
