import { describe, expect, it } from "vitest";
import { formatAge, isStale } from "./time.ts";

const at = "2026-11-13T09:00:00.000Z";
const t0 = Date.parse(at);
const MIN = 60_000;
const HOUR = 60 * MIN;

describe("formatAge", () => {
  it("formats minutes, hours and days", () => {
    expect(formatAge(at, t0 + 20_000)).toBe("just now");
    expect(formatAge(at, t0 + 12 * MIN)).toBe("12 min ago");
    expect(formatAge(at, t0 + 2 * HOUR + 5 * MIN)).toBe("2 h ago");
    expect(formatAge(at, t0 + 72 * HOUR)).toBe("3 d ago");
  });

  it("does not go negative when the clock is behind", () => {
    expect(formatAge(at, t0 - HOUR)).toBe("just now");
  });

  it("copes with a broken timestamp", () => {
    expect(formatAge("nope", t0)).toBe("at an unknown time");
  });
});

describe("isStale", () => {
  it("is stale after more than 24 hours", () => {
    expect(isStale(at, t0 + 24 * HOUR)).toBe(false);
    expect(isStale(at, t0 + 24 * HOUR + 1)).toBe(true);
  });

  it("treats a broken timestamp as stale", () => {
    expect(isStale("nope", t0)).toBe(true);
  });
});
