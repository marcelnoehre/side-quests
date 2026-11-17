const HOUR = 60 * 60 * 1000;

/** Data older than this is shown as stale. */
export const STALE_AFTER_MS = 24 * HOUR;

export function isStale(fetchedAt: string, now: number): boolean {
  const then = Date.parse(fetchedAt);
  return Number.isNaN(then) || now - then > STALE_AFTER_MS;
}

/** "just now", "12 min ago", "2 h ago", "3 d ago". */
export function formatAge(fetchedAt: string, now: number): string {
  const then = Date.parse(fetchedAt);
  if (Number.isNaN(then)) return "at an unknown time";
  const minutes = Math.floor(Math.max(0, now - then) / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `${hours} h ago`;
  return `${Math.floor(hours / 24)} d ago`;
}
