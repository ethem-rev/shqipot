import Link from "next/link";
import AppealComposer from "@/components/AppealComposer";
import AppealListItem from "@/components/AppealListItem";
import { getCurrentUser } from "@/lib/session";
import {
  appealScoresFor,
  commentCountsFor,
  handlesFor,
  listAppeals,
  userVotesMap,
} from "@/lib/store";
import { CATEGORIES, categorize, getCategory } from "@/lib/categories";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; cat?: string }>;
}) {
  const { sort = "new", cat } = await searchParams;
  const user = await getCurrentUser();

  const all = await listAppeals();
  const [counts, scores, userVotes] = await Promise.all([
    commentCountsFor(all.map((a) => a.id)),
    appealScoresFor(all.map((a) => a.id)),
    user ? userVotesMap(user.id) : Promise.resolve(new Map<string, number>()),
  ]);

  // Category tallies for the filter row.
  const tally = new Map<string, number>();
  for (const a of all) {
    const k = categorize(a);
    tally.set(k, (tally.get(k) ?? 0) + 1);
  }

  // Apply category filter + sort.
  let appeals = cat ? all.filter((a) => categorize(a) === cat) : all;
  if (sort === "top") {
    appeals = [...appeals].sort(
      (a, b) => (scores.get(b.id) ?? 0) - (scores.get(a.id) ?? 0),
    );
  }
  const handles = await handlesFor(appeals.map((a) => a.authorId));

  const pillCats = CATEGORIES.filter(
    (c) => c.key !== "other" && (tally.get(c.key) ?? 0) > 0,
  );
  const sortHref = (s: string) =>
    `/?${new URLSearchParams({ ...(cat ? { cat } : {}), sort: s })}`;
  const catHref = (k?: string) =>
    `/?${new URLSearchParams({ ...(k ? { cat: k } : {}), ...(sort !== "new" ? { sort } : {}) })}`;

  return (
    <div className="flex flex-col gap-8">
      {/* Hero */}
      <section className="flex flex-col items-center gap-4 py-6 text-center sm:py-10">
        <h1 className="max-w-2xl text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl">
          Your voice for the movement
        </h1>
        <p className="max-w-xl text-[15px] leading-relaxed text-muted sm:text-base">
          Share appeals about what matters, rally support, and decide together
          who speaks for the cause — anonymously if you choose.
        </p>
        {!user ? (
          <Link href="/login" className="btn-primary mt-1">
            📣 Post an appeal
          </Link>
        ) : null}
      </section>

      {user ? <AppealComposer /> : null}

      {/* Category filter row */}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        <Link
          href={catHref()}
          className={`pill shrink-0 ${!cat ? "pill-active" : ""}`}
        >
          🏛️ All
          <span className="opacity-70">{all.length}</span>
        </Link>
        {pillCats.map((c) => (
          <Link
            key={c.key}
            href={catHref(c.key)}
            className={`pill shrink-0 ${cat === c.key ? "pill-active" : ""}`}
          >
            <span aria-hidden>{c.emoji}</span>
            {c.label}
            <span className="opacity-70">{tally.get(c.key)}</span>
          </Link>
        ))}
      </div>

      {/* Section header + sort */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold tracking-tight">
            {cat ? getCategory(cat).label : "Latest appeals"}
          </h2>
          <div className="flex items-center gap-1 rounded-lg border border-border bg-surface p-0.5 text-xs font-medium">
            <Link
              href={sortHref("new")}
              className={`rounded-md px-2.5 py-1 transition ${sort !== "top" ? "bg-surface-2 text-fg" : "text-muted hover:text-fg"}`}
            >
              Newest
            </Link>
            <Link
              href={sortHref("top")}
              className={`rounded-md px-2.5 py-1 transition ${sort === "top" ? "bg-surface-2 text-fg" : "text-muted hover:text-fg"}`}
            >
              Most supported
            </Link>
          </div>
        </div>

        {appeals.length === 0 ? (
          <div className="card p-12 text-center text-sm text-muted">
            No appeals here yet.
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {appeals.map((appeal) => (
              <li key={appeal.id}>
                <AppealListItem
                  appeal={appeal}
                  handle={handles.get(appeal.authorId) ?? "unknown"}
                  commentCount={counts.get(appeal.id) ?? 0}
                  score={scores.get(appeal.id) ?? 0}
                  userVote={userVotes.get(appeal.id) ?? 0}
                  loggedIn={!!user}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
