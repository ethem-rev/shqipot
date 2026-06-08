import { avatarHue, initials } from "@/lib/avatar";

export default function Avatar({
  handle,
  size = 36,
}: {
  handle: string;
  size?: number;
}) {
  const hue = avatarHue(handle);
  return (
    <span
      aria-hidden
      className="inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white ring-1 ring-inset ring-white/15"
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.38),
        background: `linear-gradient(135deg, hsl(${hue} 70% 52%), hsl(${
          (hue + 40) % 360
        } 70% 42%))`,
        boxShadow: "var(--shadow-sm)",
      }}
    >
      {initials(handle)}
    </span>
  );
}
