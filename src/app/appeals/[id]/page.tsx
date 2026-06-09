import Link from "next/link";
import { notFound } from "next/navigation";
import AppealCard from "@/components/AppealCard";
import CommentForm from "@/components/CommentForm";
import CommentItem, { type CommentNode } from "@/components/CommentItem";
import { getCurrentUser } from "@/lib/session";
import {
  appealScore,
  getAppeal,
  handlesFor,
  listComments,
  userVote,
} from "@/lib/store";
import { categorize } from "@/lib/categories";

export default async function AppealPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const appeal = await getAppeal(id);
  if (!appeal) notFound();

  const user = await getCurrentUser();
  const comments = await listComments(id);
  const score = await appealScore(id);
  const myVote = user ? await userVote(id, user.id) : 0;
  const handles = await handlesFor([
    appeal.authorId,
    ...comments.map((c) => c.authorId),
  ]);

  // Build the reply tree from the flat, time-ordered comment list.
  const byId = new Map<string, CommentNode>();
  for (const c of comments) {
    byId.set(c.id, {
      ...c,
      authorHandle: handles.get(c.authorId) ?? "unknown",
      children: [],
      descendants: 0,
    });
  }
  const roots: CommentNode[] = [];
  for (const c of comments) {
    const node = byId.get(c.id)!;
    const parent = c.parentId ? byId.get(c.parentId) : undefined;
    if (parent) parent.children.push(node);
    else roots.push(node);
  }

  // Count descendants per subtree (used to auto-collapse long threads).
  const countDescendants = (node: CommentNode): number => {
    let total = 0;
    for (const child of node.children) total += 1 + countDescendants(child);
    node.descendants = total;
    return total;
  };
  roots.forEach(countDescendants);

  const authorHandle = handles.get(appeal.authorId) ?? "unknown";

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <Link
        href="/"
        className="text-sm text-muted transition hover:text-accent"
      >
        ← All appeals
      </Link>

      <AppealCard
        id={appeal.id}
        title={appeal.title}
        body={appeal.body}
        authorHandle={authorHandle}
        createdAt={appeal.createdAt}
        editedAt={appeal.editedAt}
        isOwner={!!user && appeal.authorId === user.id}
        categoryKey={categorize(appeal)}
        tags={appeal.tags}
        score={score}
        userVote={myVote}
        loggedIn={!!user}
      />

      <section className="flex flex-col gap-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
          {comments.length} {comments.length === 1 ? "comment" : "comments"}
        </h2>

        {user ? (
          <div className="card p-4">
            <CommentForm appealId={appeal.id} />
          </div>
        ) : (
          <p className="text-sm text-muted">
            <Link href="/login" className="font-medium text-accent underline">
              Sign in
            </Link>{" "}
            to join the conversation.
          </p>
        )}

        {roots.length > 0 ? (
          <ul className="flex flex-col gap-6">
            {roots.map((node) => (
              <li key={node.id} className="card p-5">
                <CommentItem
                  node={node}
                  appealId={appeal.id}
                  canReply={!!user}
                  currentUserId={user?.id}
                />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">No comments yet.</p>
        )}
      </section>
    </div>
  );
}
