import Link from "next/link";
import { commentCountsFor, listAppeals } from "@/lib/store";
import { rankConcerns } from "@/lib/categories";

export const metadata = {
  title: "Priorities — Shqipot",
};

// Always read live data from Supabase rather than prerendering at build time.
export const dynamic = "force-dynamic";

export default async function InsightsPage() {
  const appeals = await listAppeals();
  const counts = await commentCountsFor(appeals.map((a) => a.id));
  const concerns = rankConcerns(appeals, counts);
  const maxScore = concerns[0]?.score ?? 1;
  const totalAppeals = appeals.length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          What the movement is worried about
        </h1>
        <p className="text-[15px] leading-relaxed text-muted">
          Every appeal is read and sorted by the need behind it. Categories are
          ranked by total voices — appeals plus the discussion they spark — so
          the most urgent concerns rise to the top.
        </p>
      </div>

      {totalAppeals === 0 ? (
        <div className="card p-10 text-center text-sm text-muted">
          No appeals to analyze yet.{" "}
          <Link href="/" className="font-medium text-accent underline">
            Raise the first one.
          </Link>
        </div>
      ) : (
        <ol className="flex flex-col gap-3">
          {concerns.map((concern, i) => {
            const width = Math.max(6, Math.round((concern.score / maxScore) * 100));
            return (
              <li key={concern.category.key}>
                <Link
                  href={`/insights/${concern.category.key}`}
                  className="card card-hover group flex flex-col gap-3 p-5"
                >
                  <div className="flex items-center gap-3">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-surface-2 text-sm font-semibold text-muted">
                      {i + 1}
                    </span>
                    <span className="text-xl" aria-hidden>
                      {concern.category.emoji}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h2 className="font-semibold leading-tight transition group-hover:text-accent">
                        {concern.category.label}
                      </h2>
                      <p className="text-xs text-muted">
                        {concern.appealCount}{" "}
                        {concern.appealCount === 1 ? "appeal" : "appeals"} ·{" "}
                        {concern.commentCount}{" "}
                        {concern.commentCount === 1 ? "comment" : "comments"}
                      </p>
                    </div>
                    <span className="text-sm font-semibold tabular-nums">
                      {concern.score}
                    </span>
                  </div>

                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-2">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-accent to-accent-strong"
                      style={{ width: `${width}%` }}
                    />
                  </div>

                  <span className="pl-11 text-xs font-medium text-muted transition group-hover:text-accent">
                    View all {concern.appealCount}{" "}
                    {concern.appealCount === 1 ? "appeal" : "appeals"} →
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
