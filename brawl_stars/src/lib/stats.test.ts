import { describe, expect, it } from "vitest";
import {
  goalBoundary,
  pushGoal,
  averageTrophies,
  lowest,
  medianTrophies,
  shareAtMedianStep,
  stepCounts,
} from "./stats.ts";

const list = [
  { id: 1, trophies: 556 },
  { id: 2, trophies: 413 },
  { id: 3, trophies: 500 },
  { id: 4, trophies: 0 },
  { id: 5, trophies: 538 },
];

describe("medianTrophies", () => {
  it("returns the middle value", () => {
    expect(medianTrophies(list)).toBe(500);
  });

  it("returns the lower middle value for an even count", () => {
    expect(medianTrophies(list.slice(0, 4))).toBe(413);
  });

  it("is 0 without brawlers", () => {
    expect(medianTrophies([])).toBe(0);
  });
});

describe("averageTrophies", () => {
  it("returns the rounded mean", () => {
    expect(averageTrophies(list)).toBe(401); // 2007 / 5 = 401.4
    expect(averageTrophies([{ trophies: 1 }, { trophies: 2 }])).toBe(2);
  });

  it("is 0 without brawlers", () => {
    expect(averageTrophies([])).toBe(0);
  });
});

describe("lowest", () => {
  it("finds the brawler with the fewest trophies", () => {
    expect(lowest(list)?.id).toBe(4);
    expect(lowest([])).toBeUndefined();
  });
});

describe("stepCounts", () => {
  it("counts brawlers per step and skips empty steps", () => {
    expect(stepCounts(list)).toEqual([
      { step: 0, count: 1 },
      { step: 4, count: 1 },
      { step: 5, count: 3 },
    ]);
  });
});

describe("shareAtMedianStep", () => {
  it("reports the share of brawlers at or above the median step", () => {
    expect(shareAtMedianStep(list)).toEqual({ threshold: 500, share: 0.6 });
  });

  it("handles an empty list", () => {
    expect(shareAtMedianStep([])).toEqual({ threshold: 0, share: 0 });
  });
});

describe("pushGoal", () => {
  it("is the next step for the lowest brawler", () => {
    const push = [{ trophies: 1101 }, { trophies: 1199 }, { trophies: 1200 }];
    expect(pushGoal(push)).toEqual({
      goal: 1200,
      remaining: 2,
      remainingAverage: 1150,
      missingTrophies: 100, // 99 + 1
    });
  });

  it("averages only the brawlers below the goal", () => {
    const push = [{ trophies: 1101 }, { trophies: 1104 }, { trophies: 3000 }];
    expect(pushGoal(push).remainingAverage).toBe(1103); // 1102.5 rounded
    expect(pushGoal(push).missingTrophies).toBe(195); // 99 + 96
  });

  it("moves on once the lowest brawler sits exactly on a step", () => {
    expect(pushGoal([{ trophies: 1200 }, { trophies: 1250 }])).toEqual({
      goal: 1300,
      remaining: 2,
      remainingAverage: 1225,
      missingTrophies: 150, // 100 + 50
    });
  });

  it("starts at the first step and handles an empty list", () => {
    expect(pushGoal(list)).toEqual({
      goal: 100,
      remaining: 1,
      remainingAverage: 0,
      missingTrophies: 100,
    });
    expect(pushGoal([])).toEqual({
      goal: 0,
      remaining: 0,
      remainingAverage: 0,
      missingTrophies: 0,
    });
  });
});

describe("goalBoundary", () => {
  const t = (...values: number[]) => values.map((trophies) => ({ trophies }));

  it("finds the switch in ascending and descending order", () => {
    expect(goalBoundary(t(1101, 1150, 1200, 1300), 1200)).toBe(2);
    expect(goalBoundary(t(1300, 1200, 1150, 1101), 1200)).toBe(2);
  });

  it("is undefined when the groups are interleaved", () => {
    expect(goalBoundary(t(1101, 1300, 1150, 1200), 1200)).toBeUndefined();
  });

  it("is undefined when everyone is on the same side", () => {
    expect(goalBoundary(t(1101, 1150), 1200)).toBeUndefined();
    expect(goalBoundary([], 1200)).toBeUndefined();
  });
});
