"use client";

import { useTransition } from "react";
import { toggleEndorsement } from "@/lib/actions";

export default function EndorseButton({
  candidateId,
  endorsed,
  count,
  isSelf,
  loggedIn,
}: {
  candidateId: string;
  endorsed: boolean;
  count: number;
  isSelf: boolean;
  loggedIn: boolean;
}) {
  const [pending, startTransition] = useTransition();

  if (isSelf) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted">
        You · {count} {count === 1 ? "backer" : "backers"}
      </span>
    );
  }

  if (!loggedIn) {
    return (
      <a href="/login" className="btn-secondary btn-sm">
        Sign in to endorse · {count}
      </a>
    );
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => toggleEndorsement(candidateId))}
      aria-pressed={endorsed}
      className={endorsed ? "btn-secondary btn-sm" : "btn-primary btn-sm"}
    >
      {endorsed ? "✓ Endorsed" : "Endorse"} · {count}
    </button>
  );
}
