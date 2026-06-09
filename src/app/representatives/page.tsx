import Link from "next/link";
import ApplyForm from "@/components/ApplyForm";
import CandidateCard from "@/components/CandidateCard";
import { withdrawCandidacy } from "@/lib/actions";
import { representChoices } from "@/lib/categories";
import { getCurrentUser } from "@/lib/session";
import {
  endorsedBy,
  endorsementCounts,
  getCandidateByUser,
  handlesFor,
  listCandidates,
} from "@/lib/store";

export const metadata = {
  title: "Representatives — Shqipot",
};

export default async function RepresentativesPage() {
  const user = await getCurrentUser();
  const candidates = await listCandidates();
  const counts = await endorsementCounts();
  const endorsed = user ? await endorsedBy(user.id) : new Set<string>();
  const handles = await handlesFor(candidates.map((c) => c.userId));
  const mine = user ? await getCandidateByUser(user.id) : undefined;

  const ranked = [...candidates].sort(
    (a, b) =>
      (counts.get(b.id) ?? 0) - (counts.get(a.id) ?? 0) ||
      a.createdAt - b.createdAt,
  );

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          Who represents us
        </h1>
        <p className="text-[15px] leading-relaxed text-muted">
          Anyone can step up to speak for the movement or for a specific need.
          The crowd decides who leads by endorsing them — no one is appointed.
        </p>
      </div>

      {/* Apply / manage candidacy */}
      {user ? (
        <section className="card flex flex-col gap-3 p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold tracking-tight text-muted">
              {mine ? "Your candidacy" : "Stand as a representative"}
            </h2>
            {mine ? (
              <form action={withdrawCandidacy}>
                <button
                  type="submit"
                  className="text-xs font-medium text-muted transition hover:text-accent"
                >
                  Withdraw
                </button>
              </form>
            ) : null}
          </div>
          <ApplyForm
            choices={representChoices()}
            current={
              mine
                ? { statement: mine.statement, categoryKey: mine.categoryKey }
                : undefined
            }
          />
        </section>
      ) : (
        <div className="card p-5 text-sm">
          <Link href="/login" className="font-medium text-accent underline">
            Sign in
          </Link>{" "}
          to stand as a representative or endorse others.
        </div>
      )}

      {/* Candidate list */}
      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
          Candidates by support
        </h2>
        {ranked.length === 0 ? (
          <div className="card p-10 text-center text-sm text-muted">
            No one has stepped up yet. Be the first.
          </div>
        ) : (
          <ol className="flex flex-col gap-3">
            {ranked.map((candidate, i) => (
              <li key={candidate.id}>
                <CandidateCard
                  candidate={candidate}
                  handle={handles.get(candidate.userId) ?? "unknown"}
                  count={counts.get(candidate.id) ?? 0}
                  endorsed={endorsed.has(candidate.id)}
                  isSelf={!!user && candidate.userId === user.id}
                  loggedIn={!!user}
                  rank={i + 1}
                />
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
