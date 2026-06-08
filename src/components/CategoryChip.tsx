import { getCategory } from "@/lib/categories";

export default function CategoryChip({
  categoryKey,
  size = "md",
}: {
  categoryKey: string;
  size?: "sm" | "md";
}) {
  const cat = getCategory(categoryKey);
  const pad = size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border border-border bg-surface-2 font-medium text-muted ${pad}`}
      title={cat.description}
    >
      <span aria-hidden>{cat.emoji}</span>
      {cat.label}
    </span>
  );
}
