"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { voteOnAppeal } from "@/lib/actions";

export default function VoteButton({
  appealId,
  score,
  userVote,
  loggedIn,
}: {
  appealId: string;
  score: number;
  userVote: number; // -1, 0, or 1
  loggedIn: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const vote = (direction: number) => {
    if (!loggedIn) {
      router.push("/login");
      return;
    }
    startTransition(() => voteOnAppeal(appealId, direction));
  };

  const arrow = (up: boolean) => (
    <button
      type="button"
      onClick={() => vote(up ? 1 : -1)}
      disabled={pending}
      aria-label={up ? "Upvote" : "Downvote"}
      aria-pressed={up ? userVote > 0 : userVote < 0}
      className={`grid h-8 w-8 place-items-center rounded-md transition hover:bg-surface-2 disabled:opacity-50 ${
        (up ? userVote > 0 : userVote < 0) ? "text-accent" : "text-muted hover:text-fg"
      }`}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        {up ? <path d="m5 12 7-7 7 7M12 19V5" /> : <path d="M12 5v14m7-7-7 7-7-7" />}
      </svg>
    </button>
  );

  return (
    <div className="flex w-11 shrink-0 flex-col items-center gap-1">
      {arrow(true)}
      <span
        className={`text-sm font-semibold tabular-nums ${
          userVote > 0 ? "text-accent" : userVote < 0 ? "text-muted" : "text-fg"
        }`}
      >
        {score}
      </span>
      {arrow(false)}
    </div>
  );
}
