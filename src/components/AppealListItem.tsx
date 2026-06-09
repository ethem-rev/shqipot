import Link from "next/link";
import CategoryChip from "./CategoryChip";
import VoteButton from "./VoteButton";
import { categorize } from "@/lib/categories";
import type { Appeal } from "@/lib/types";

function UserGlyph() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function CommentGlyph() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

export default function AppealListItem({
  appeal,
  handle,
  commentCount,
  score,
  userVote,
  loggedIn,
}: {
  appeal: Appeal;
  handle: string;
  commentCount: number;
  score: number;
  userVote: number;
  loggedIn: boolean;
}) {
  return (
    <div className="card card-hover flex gap-4 p-5">
      <VoteButton
        appealId={appeal.id}
        score={score}
        userVote={userVote}
        loggedIn={loggedIn}
      />
      <div className="min-w-0 flex-1">
        <div className="mb-2">
          <CategoryChip categoryKey={categorize(appeal)} size="sm" />
        </div>
        <Link href={`/appeals/${appeal.id}`} className="group block">
          <h3 className="mb-1.5 line-clamp-2 text-lg font-semibold leading-snug tracking-tight transition group-hover:text-accent">
            {appeal.title}
          </h3>
          <p className="mb-3 line-clamp-2 whitespace-pre-wrap text-sm leading-relaxed text-muted">
            {appeal.body}
          </p>
        </Link>
        {appeal.tags.length > 0 ? (
          <div className="mb-3 flex flex-wrap gap-2">
            {appeal.tags.map((t) => (
              <span key={t} className="tag">
                {t}
              </span>
            ))}
          </div>
        ) : null}
        <div className="flex items-center gap-4 text-xs text-muted">
          <span className="flex items-center gap-1.5">
            <UserGlyph />
            {handle}
          </span>
          <span className="flex items-center gap-1.5">
            <CommentGlyph />
            {commentCount} {commentCount === 1 ? "comment" : "comments"}
          </span>
        </div>
      </div>
    </div>
  );
}
