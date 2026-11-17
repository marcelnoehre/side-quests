import type { Brawler } from "../types.ts";

export const SORT_MODES = [
  "trophiesAsc",
  "trophiesDesc",
  "name",
  "release",
] as const;

export type SortMode = (typeof SORT_MODES)[number];

/** Lowest first: answers "who to push next". */
export const DEFAULT_SORT: SortMode = "trophiesAsc";

type Sortable = Pick<Brawler, "id" | "name" | "trophies">;

const byName = (a: Sortable, b: Sortable) =>
  a.name.localeCompare(b.name, "en", { sensitivity: "base" }) || a.id - b.id;

const comparators: Record<SortMode, (a: Sortable, b: Sortable) => number> = {
  trophiesAsc: (a, b) => a.trophies - b.trophies || byName(a, b),
  trophiesDesc: (a, b) => b.trophies - a.trophies || byName(a, b),
  name: byName,
  // Brawler ids are handed out in release order.
  release: (a, b) => a.id - b.id,
};

/** Returns a new sorted array; the input is left untouched. */
export function sortBrawlers<T extends Sortable>(
  brawlers: readonly T[],
  mode: SortMode,
): T[] {
  return [...brawlers].sort(comparators[mode]);
}
