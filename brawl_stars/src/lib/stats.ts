import { stepGoal, stepIndex, stepStart } from "./buckets.ts";

type HasTrophies = { trophies: number };

/** Median trophies; for an even count the lower of the two middle values. */
export function medianTrophies(brawlers: readonly HasTrophies[]): number {
  if (brawlers.length === 0) return 0;
  const sorted = brawlers.map((b) => b.trophies).sort((a, b) => a - b);
  return sorted[Math.floor((sorted.length - 1) / 2)];
}

/** Mean trophies per brawler, rounded to a whole number. */
export function averageTrophies(brawlers: readonly HasTrophies[]): number {
  if (brawlers.length === 0) return 0;
  const total = brawlers.reduce((sum, b) => sum + b.trophies, 0);
  return Math.round(total / brawlers.length);
}

/** The brawler with the fewest trophies (first one wins ties). */
export function lowest<T extends HasTrophies>(
  brawlers: readonly T[],
): T | undefined {
  return brawlers.reduce<T | undefined>(
    (min, b) => (min === undefined || b.trophies < min.trophies ? b : min),
    undefined,
  );
}

/** How many brawlers currently sit in each step, lowest step first; empty steps omitted. */
export function stepCounts(
  brawlers: readonly HasTrophies[],
): Array<{ step: number; count: number }> {
  const counts = new Map<number, number>();
  for (const b of brawlers) {
    const step = stepIndex(b.trophies);
    counts.set(step, (counts.get(step) ?? 0) + 1);
  }
  return [...counts]
    .map(([step, count]) => ({ step, count }))
    .sort((a, b) => a.step - b.step);
}

/**
 * Share of brawlers that have reached the median step, e.g. { threshold: 500, share: 0.62 }
 * for "62% at 500+".
 */
export function shareAtMedianStep(brawlers: readonly HasTrophies[]): {
  threshold: number;
  share: number;
} {
  const threshold = stepStart(stepIndex(medianTrophies(brawlers)));
  if (brawlers.length === 0) return { threshold, share: 0 };
  const reached = brawlers.filter((b) => b.trophies >= threshold).length;
  return { threshold, share: reached / brawlers.length };
}

/**
 * The current goal of the even push: the next step for the lowest brawler, e.g. 1200 when
 * the lowest brawler is at 1101. `remaining` is how many brawlers are still below it,
 * `remainingAverage` their average trophies (the "to-go average") and `missingTrophies`
 * how many trophies they need in total to all reach the goal.
 */
export function pushGoal(brawlers: readonly HasTrophies[]): {
  goal: number;
  remaining: number;
  remainingAverage: number;
  missingTrophies: number;
} {
  const low = lowest(brawlers);
  if (!low) {
    return { goal: 0, remaining: 0, remainingAverage: 0, missingTrophies: 0 };
  }
  const goal = stepGoal(stepIndex(low.trophies));
  const below = brawlers.filter((b) => b.trophies < goal);
  return {
    goal,
    remaining: below.length,
    remainingAverage: averageTrophies(below),
    missingTrophies: below.reduce((sum, b) => sum + goal - b.trophies, 0),
  };
}

/**
 * Index of the row before which a goal separator belongs: the single place in an ordered
 * list where brawlers switch between below the goal and at or above it. Undefined when the
 * two groups are interleaved (e.g. sorted by name) or one of them is empty.
 */
export function goalBoundary(
  brawlers: readonly HasTrophies[],
  goal: number,
): number | undefined {
  let boundary: number | undefined;
  for (let i = 1; i < brawlers.length; i++) {
    const before = brawlers[i - 1].trophies >= goal;
    const after = brawlers[i].trophies >= goal;
    if (before !== after) {
      if (boundary !== undefined) return undefined;
      boundary = i;
    }
  }
  return boundary;
}
