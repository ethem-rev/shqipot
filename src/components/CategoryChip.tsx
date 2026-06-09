import { getCategory } from "@/lib/categories";

// A distinct color per category for quick visual scanning.
const COLORS: Record<string, string> = {
  safety: "#dc2626",
  missing: "#7c3aed",
  legal: "#4f46e5",
  health: "#059669",
  food: "#d97706",
  housing: "#ea580c",
  economy: "#2563eb",
  internet: "#0891b2",
  speech: "#db2777",
  governance: "#0d9488",
  general: "#e11d48",
  other: "#6b7280",
};

export default function CategoryChip({
  categoryKey,
  size = "md",
}: {
  categoryKey: string;
  size?: "sm" | "md";
}) {
  const cat = getCategory(categoryKey);
  const color = COLORS[categoryKey] ?? COLORS.other;
  const pad = size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs";
  return (
    <span
      className={`inline-flex w-fit items-center gap-1 rounded-md font-semibold ${pad}`}
      style={{ color, backgroundColor: `${color}1a` }}
      title={cat.description}
    >
      <span aria-hidden>{cat.emoji}</span>
      {cat.label}
    </span>
  );
}
