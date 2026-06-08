import Link from "next/link";
import Avatar from "./Avatar";
import CategoryChip from "./CategoryChip";
import { categorize } from "@/lib/categories";
import { relativeTime } from "@/lib/format";
import type { Appeal } from "@/lib/types";

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
  showCategory = true,
}: {
  appeal: Appeal;
  handle: string;
  commentCount: number;
  showCategory?: boolean;
}) {
  return (
    <Link
      href={`/appeals/${appeal.id}`}
      className="card card-hover group flex flex-col gap-3 p-5"
    >
      <div className="flex items-center gap-2.5 text-sm">
        <Avatar handle={handle} size={28} />
        <span className="font-medium">@{handle}</span>
        <span className="text-muted">· {relativeTime(appeal.createdAt)}</span>
      </div>
      <div>
        <h3 className="text-lg font-semibold leading-snug tracking-tight transition group-hover:text-accent">
          {appeal.title}
        </h3>
        <p className="mt-1 line-clamp-3 whitespace-pre-wrap text-[15px] leading-relaxed text-muted">
          {appeal.body}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
        {showCategory ? (
          <CategoryChip categoryKey={categorize(appeal)} size="sm" />
        ) : null}
        <span className="flex items-center gap-1.5">
          <CommentGlyph />
          {commentCount} {commentCount === 1 ? "comment" : "comments"}
        </span>
      </div>
    </Link>
  );
}
