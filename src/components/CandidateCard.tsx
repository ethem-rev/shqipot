import Avatar from "./Avatar";
import CategoryChip from "./CategoryChip";
import EndorseButton from "./EndorseButton";
import { relativeTime } from "@/lib/format";
import type { Candidate } from "@/lib/types";

export default function CandidateCard({
  candidate,
  handle,
  count,
  endorsed,
  isSelf,
  loggedIn,
  rank,
}: {
  candidate: Candidate;
  handle: string;
  count: number;
  endorsed: boolean;
  isSelf: boolean;
  loggedIn: boolean;
  rank?: number;
}) {
  return (
    <div className="card flex flex-col gap-3 p-5">
      <div className="flex items-center gap-3">
        {rank ? (
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-surface-2 text-sm font-semibold text-muted">
            {rank}
          </span>
        ) : null}
        <Avatar handle={handle} size={36} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">@{handle}</span>
            {isSelf ? (
              <span className="rounded-md bg-surface-2 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted">
                you
              </span>
            ) : null}
          </div>
          <span className="text-xs text-muted">
            stepped up {relativeTime(candidate.createdAt)}
          </span>
        </div>
        <CategoryChip categoryKey={candidate.categoryKey} size="sm" />
      </div>

      <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed">
        {candidate.statement}
      </p>

      <div className="flex justify-end">
        <EndorseButton
          candidateId={candidate.id}
          endorsed={endorsed}
          count={count}
          isSelf={isSelf}
          loggedIn={loggedIn}
        />
      </div>
    </div>
  );
}
