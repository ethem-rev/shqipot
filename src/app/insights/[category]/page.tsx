import Link from "next/link";
import { notFound } from "next/navigation";
import AppealListItem from "@/components/AppealListItem";
import CandidateCard from "@/components/CandidateCard";
import { getCurrentUser } from "@/lib/session";
import {
  countComments,
  endorsedBy,
  endorsementCounts,
  handlesFor,
  listAppeals,
  listCandidates,
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
  const appeals = listAppeals().filter((a) => categorize(a) === category);

  // Representatives who chose to champion this need, ranked by support.
  const counts = endorsementCounts();
  const endorsed = user ? endorsedBy(user.id) : new Set<string>();
  const reps = listCandidates()
    .filter((c) => c.categoryKey === category)
    .sort(
      (a, b) =>
        (counts.get(b.id) ?? 0) - (counts.get(a.id) ?? 0) ||
        a.createdAt - b.createdAt,
    );

  const handles = handlesFor([
    ...appeals.map((a) => a.authorId),
    ...reps.map((c) => c.userId),
  ]);

  return (
    <div className="flex flex-col gap-6">
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
                commentCount={countComments(appeal.id)}
                showCategory={false}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
