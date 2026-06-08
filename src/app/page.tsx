import Link from "next/link";
import AppealComposer from "@/components/AppealComposer";
import AppealListItem from "@/components/AppealListItem";
import { getCurrentUser } from "@/lib/session";
import { countComments, handlesFor, listAppeals } from "@/lib/store";
import { rankConcerns } from "@/lib/categories";

export default async function Home() {
  const user = await getCurrentUser();
  const appeals = listAppeals();
  const handles = handlesFor(appeals.map((a) => a.authorId));
  const concerns = rankConcerns(appeals, (id) => countComments(id));
  const topScore = concerns[0]?.score ?? 1;

  return (
    <div className="flex flex-col gap-8">
      {user ? (
        <AppealComposer />
      ) : (
        <div className="card p-8 sm:p-10">
          <h1 className="text-3xl font-semibold leading-[1.1] tracking-tight sm:text-4xl">
            Your voice,{" "}
            <span className="bg-gradient-to-r from-accent to-accent-strong bg-clip-text text-transparent">
              together
            </span>
            .
          </h1>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-muted">
            Raise appeals, rally support, and decide who speaks for the
            movement — anonymously if you choose.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/login" className="btn-primary">
              Sign in or generate an ID
            </Link>
            <Link href="/insights" className="btn-secondary">
              See priorities
            </Link>
          </div>
        </div>
      )}

      {concerns.length > 0 ? (
        <section className="card flex flex-col gap-4 p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
              Top concerns
            </h2>
            <Link
              href="/insights"
              className="text-xs font-medium text-accent transition hover:underline"
            >
              See all priorities →
            </Link>
          </div>
          <ol className="flex flex-col gap-1">
            {concerns.slice(0, 5).map((concern, i) => (
              <li key={concern.category.key}>
                <Link
                  href={`/insights/${concern.category.key}`}
                  className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-1.5 transition hover:bg-surface-2"
                >
                  <span className="w-4 text-sm font-semibold tabular-nums text-muted">
                    {i + 1}
                  </span>
                  <span className="w-44 shrink-0 truncate text-sm">
                    <span aria-hidden className="mr-1.5">
                      {concern.category.emoji}
                    </span>
                    {concern.category.label}
                  </span>
                  <span className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
                    <span
                      className="block h-full rounded-full bg-gradient-to-r from-accent to-accent-strong"
                      style={{
                        width: `${Math.max(
                          6,
                          Math.round((concern.score / topScore) * 100),
                        )}%`,
                      }}
                    />
                  </span>
                  <span className="w-6 text-right text-sm font-semibold tabular-nums text-muted">
                    {concern.score}
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
          Latest appeals
        </h2>
        {appeals.length === 0 ? (
          <div className="card p-10 text-center">
            <p className="text-sm text-muted">
              No appeals yet. Be the first to raise one.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {appeals.map((appeal) => (
              <li key={appeal.id}>
                <AppealListItem
                  appeal={appeal}
                  handle={handles.get(appeal.authorId) ?? "unknown"}
                  commentCount={countComments(appeal.id)}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
