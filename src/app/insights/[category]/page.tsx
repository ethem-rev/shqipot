import Link from "next/link";
import { notFound } from "next/navigation";
import AppealListItem from "@/components/AppealListItem";
import CandidateCard from "@/components/CandidateCard";
import { getCurrentUser } from "@/lib/session";
import {
  appealScoresFor,
  commentCountsFor,
  endorsedBy,
  endorsementCounts,
  handlesFor,
  listAppeals,
  listCandidates,
  userVotesMap,
} from "@/lib/store";
import { CATEGORIES, categorize, getCategory } from "@/lib/categories";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const cat = getCategory(category);
  return { title: `${cat.label} — Shqipot` };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const known = CATEGORIES.some((c) => c.key === category);
  if (!known) notFound();

  const cat = getCategory(category);
  const user = await getCurrentUser();
  const appeals = (await listAppeals()).filter(
    (a) => categorize(a) === category,
  );
  const commentCounts = await commentCountsFor(appeals.map((a) => a.id));
  const scores = await appealScoresFor(appeals.map((a) => a.id));
  const votes = user ? await userVotesMap(user.id) : new Map<string, number>();

  // Representatives who chose to champion this need, ranked by support.
  const counts = await endorsementCounts();
  const endorsed = user ? await endorsedBy(user.id) : new Set<string>();
  const reps = (await listCandidates())
    .filter((c) => c.categoryKey === category)
    .sort(
      (a, b) =>
        (counts.get(b.id) ?? 0) - (counts.get(a.id) ?? 0) ||
        a.createdAt - b.createdAt,
    );

  const handles = await handlesFor([
    ...appeals.map((a) => a.authorId),
    ...reps.map((c) => c.userId),
  ]);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <Link
        href="/insights"
        className="text-sm text-muted transition hover:text-accent"
      >
        ← Priorities
      </Link>

      <header className="card flex items-start gap-4 p-6">
        <span className="text-3xl" aria-hidden>
          {cat.emoji}
        </span>
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">{cat.label}</h1>
          <p className="text-[15px] leading-relaxed text-muted">
            {cat.description}
          </p>
          <p className="mt-1 text-sm text-muted">
            {appeals.length} {appeals.length === 1 ? "appeal" : "appeals"} in
            this category
          </p>
        </div>
      </header>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
            Stepping up for this need
          </h2>
          <Link
            href="/representatives"
            className="text-xs font-medium text-accent transition hover:underline"
          >
            All representatives →
          </Link>
        </div>
        {reps.length === 0 ? (
          <div className="card p-6 text-center text-sm text-muted">
            No one represents this need yet.{" "}
            <Link
              href="/representatives"
              className="font-medium text-accent underline"
            >
              Stand up for it.
            </Link>
          </div>
        ) : (
          <ol className="flex flex-col gap-3">
            {reps.map((c, i) => (
              <li key={c.id}>
                <CandidateCard
                  candidate={c}
                  handle={handles.get(c.userId) ?? "unknown"}
                  count={counts.get(c.id) ?? 0}
                  endorsed={endorsed.has(c.id)}
                  isSelf={!!user && c.userId === user.id}
                  loggedIn={!!user}
                  rank={i + 1}
                />
              </li>
            ))}
          </ol>
        )}
      </section>

      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
        Appeals
      </h2>
      {appeals.length === 0 ? (
        <div className="card p-10 text-center text-sm text-muted">
          No appeals in this category yet.
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {appeals.map((appeal) => (
            <li key={appeal.id}>
              <AppealListItem
                appeal={appeal}
                handle={handles.get(appeal.authorId) ?? "unknown"}
                commentCount={commentCounts.get(appeal.id) ?? 0}
                score={scores.get(appeal.id) ?? 0}
                userVote={votes.get(appeal.id) ?? 0}
                loggedIn={!!user}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
