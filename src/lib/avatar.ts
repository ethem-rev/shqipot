// Deterministic avatar derived from a handle — same handle always renders the
// same initials and color, with no images to load.

export function initials(handle: string): string {
  const clean = handle.replace(/^anon-/, "");
  const letters = clean.replace(/[^a-zA-Z0-9]/g, "");
  return (letters.slice(0, 2) || handle.slice(0, 2)).toUpperCase();
}

export function avatarHue(handle: string): number {
  let hash = 0;
  for (let i = 0; i < handle.length; i++) {
    hash = (hash * 31 + handle.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % 360;
}
