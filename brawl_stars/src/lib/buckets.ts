import { MIN_COLUMNS, STEP } from "../config.ts";

/** Index of the step (grid column) a trophy count falls into. */
export function stepIndex(trophies: number): number {
  return Math.floor(Math.max(0, trophies) / STEP);
}

/** First trophy value of a step, e.g. step 5 -> 500. */
export function stepStart(step: number): number {
  return step * STEP;
}

/** Last trophy value of a step, e.g. step 5 -> 599. */
export function stepEnd(step: number): number {
  return (step + 1) * STEP - 1;
}

/**
 * Trophies that complete a step, e.g. step 5 -> 600. Columns are labelled with this
 * value, so the column "2000" is full once a brawler has 2000 trophies.
 */
export function stepGoal(step: number): number {
  return (step + 1) * STEP;
}

/**
 * How much of a step's cell is filled: 1 for completed steps, the progress through the
 * current step, 0 for steps not reached yet.
 */
export function fillFraction(trophies: number, step: number): number {
  const current = stepIndex(trophies);
  if (step < current) return 1;
  if (step > current) return 0;
  return (Math.max(0, trophies) % STEP) / STEP;
}

/**
 * Number of grid columns needed for a set of brawlers: enough to reach the highest
 * trophy count any brawler has had. Derived from the data, so there is no trophy cap.
 */
export function columnCount(
  brawlers: ReadonlyArray<{ trophies: number; highestTrophies: number }>,
): number {
  const top = brawlers.reduce(
    (max, b) => Math.max(max, b.trophies, b.highestTrophies),
    0,
  );
  return Math.max(MIN_COLUMNS, Math.ceil(top / STEP));
}
