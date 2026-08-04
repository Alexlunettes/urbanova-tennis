/**
 * Joins class names, dropping falsy values.
 * Deliberately dependency-free — the project has no clsx/tailwind-merge and
 * does not need conflict resolution, only concatenation.
 */
export function cn(...parts) {
  return parts.flat(Infinity).filter(Boolean).join(' ')
}
