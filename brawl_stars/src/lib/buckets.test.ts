import { describe, expect, it } from "vitest";
import { MIN_COLUMNS } from "../config.ts";
import {
  columnCount,
  fillFraction,
  stepEnd,
  stepGoal,
  stepIndex,
  stepStart,
} from "./buckets.ts";

describe("stepIndex", () => {
  it("puts 0 trophies in the first step", () => {
    expect(stepIndex(0)).toBe(0);
  });

  it("moves to the next step on exact multiples of 100", () => {
    expect(stepIndex(99)).toBe(0);
    expect(stepIndex(100)).toBe(1);
    expect(stepIndex(556)).toBe(5);
    expect(stepIndex(1000)).toBe(10);
  });

  it("treats negative input as 0", () => {
    expect(stepIndex(-5)).toBe(0);
  });
});

describe("stepStart / stepEnd", () => {
  it("gives the trophy range of a step", () => {
    expect(stepStart(0)).toBe(0);
    expect(stepEnd(0)).toBe(99);
    expect(stepStart(5)).toBe(500);
    expect(stepEnd(5)).toBe(599);
  });
});

describe("stepGoal", () => {
  it("is the trophy count that fills the step", () => {
    expect(stepGoal(0)).toBe(100);
    expect(stepGoal(19)).toBe(2000);
    expect(fillFraction(stepGoal(19), 19)).toBe(1);
    expect(fillFraction(stepGoal(19) - 1, 19)).toBeLessThan(1);
  });
});

describe("fillFraction", () => {
  it("is 0 everywhere at 0 trophies", () => {
    expect(fillFraction(0, 0)).toBe(0);
    expect(fillFraction(0, 1)).toBe(0);
  });

  it("is 1 below, partial in, and 0 above the current step", () => {
    expect(fillFraction(556, 4)).toBe(1);
    expect(fillFraction(556, 5)).toBeCloseTo(0.56);
    expect(fillFraction(556, 6)).toBe(0);
  });

  it("starts a new empty step on exact multiples of 100", () => {
    expect(fillFraction(500, 4)).toBe(1);
    expect(fillFraction(500, 5)).toBe(0);
  });
});

describe("columnCount", () => {
  it("never goes below MIN_COLUMNS", () => {
    expect(columnCount([])).toBe(MIN_COLUMNS);
    expect(columnCount([{ trophies: 0, highestTrophies: 0 }])).toBe(
      MIN_COLUMNS,
    );
  });

  it("uses highestTrophies when it is above current trophies", () => {
    const n = columnCount([
      { trophies: 413, highestTrophies: 1234 },
      { trophies: 900, highestTrophies: 950 },
    ]);
    expect(n).toBe(13);
    expect(stepGoal(n - 1)).toBe(1300);
  });

  it("ends exactly at the top when it is a multiple of 100, without a cap", () => {
    const n = columnCount([{ trophies: 3000, highestTrophies: 3000 }]);
    expect(n).toBe(30);
    expect(stepGoal(n - 1)).toBe(3000);
    expect(fillFraction(3000, n - 1)).toBe(1);
    expect(columnCount([{ trophies: 3001, highestTrophies: 3001 }])).toBe(31);
  });
});
