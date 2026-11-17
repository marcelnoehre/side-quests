import { describe, expect, it } from "vitest";
import {
  COLOR_STOPS,
  INK_DARK,
  INK_LIGHT,
  stepColor,
  stepInk,
  stepInkContrast,
  stepOklch,
} from "./colors.ts";

const last = COLOR_STOPS.length - 1;

describe("stepOklch", () => {
  it("starts at the first stop and ends at the last one", () => {
    for (const columns of [10, 31, 80]) {
      expect(stepOklch(0, columns)).toEqual(COLOR_STOPS[0]);
      const top = stepOklch(columns - 1, columns);
      expect(top.l).toBeCloseTo(COLOR_STOPS[last].l);
      expect(top.c).toBeCloseTo(COLOR_STOPS[last].c);
      expect(top.h).toBeCloseTo(COLOR_STOPS[last].h);
    }
  });

  it("hits every stop when the columns line up with the stops", () => {
    const columns = last * 3 + 1;
    COLOR_STOPS.forEach((stop, i) => {
      const { l, c, h } = stepOklch(i * 3, columns);
      expect(l).toBeCloseTo(stop.l);
      expect(c).toBeCloseTo(stop.c);
      expect(h).toBeCloseTo(stop.h);
    });
  });

  it("interpolates between stops", () => {
    const columns = last * 2 + 1;
    const mid = stepOklch(1, columns);
    expect(mid.l).toBeCloseTo((COLOR_STOPS[0].l + COLOR_STOPS[1].l) / 2);
    expect(mid.c).toBeCloseTo((COLOR_STOPS[0].c + COLOR_STOPS[1].c) / 2);
  });

  it("takes the shorter way around the hue circle", () => {
    // violet (295) -> red (25) goes through magenta, not back through green
    const columns = last * 2 + 1;
    const h = stepOklch(11, columns).h;
    expect(h > 295 || h < 25).toBe(true);
  });

  it("clamps steps outside the grid", () => {
    expect(stepOklch(-3, 31)).toEqual(stepOklch(0, 31));
    expect(stepOklch(99, 31)).toEqual(stepOklch(30, 31));
  });

  it("gives neighbouring columns different colours", () => {
    for (const columns of [10, 31, 80]) {
      for (let step = 0; step < columns - 1; step++) {
        expect(stepColor(step, columns)).not.toBe(stepColor(step + 1, columns));
      }
    }
  });
});

describe("stepColor", () => {
  it("returns a CSS oklch() colour", () => {
    expect(stepColor(0, 31)).toBe("oklch(0.500 0.070 55.0)");
    expect(stepColor(7, 31)).toMatch(/^oklch\(\d\.\d{3} \d\.\d{3} \d+\.\d\)$/);
  });
});

describe("stepInk", () => {
  it("uses dark text on light columns and light text on dark ones", () => {
    const columns = last + 1;
    expect(stepInk(0, columns)).toBe(INK_LIGHT); // wood brown
    expect(stepInk(3, columns)).toBe(INK_DARK); // gold
    expect(stepInk(last, columns)).toBe(INK_LIGHT); // black-gold
  });

  it("keeps trophy numbers readable on every column colour", () => {
    for (const columns of [10, 16, 31, 50, 80]) {
      for (let step = 0; step < columns; step++) {
        expect(stepInkContrast(step, columns)).toBeGreaterThanOrEqual(4.5);
      }
    }
  });
});
