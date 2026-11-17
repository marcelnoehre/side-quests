import { describe, expect, it } from "vitest";
import { DEFAULT_SORT, sortBrawlers } from "./sort.ts";

const list = [
  { id: 3, name: "Bull", trophies: 500 },
  { id: 1, name: "shelly", trophies: 556 },
  { id: 2, name: "Colt", trophies: 413 },
  { id: 4, name: "Brock", trophies: 500 },
  { id: 5, name: "Rico", trophies: 0 },
];

const names = (l: { name: string }[]) => l.map((b) => b.name);

describe("sortBrawlers", () => {
  it("defaults to lowest trophies first, ties by name", () => {
    expect(names(sortBrawlers(list, DEFAULT_SORT))).toEqual([
      "Rico",
      "Colt",
      "Brock",
      "Bull",
      "shelly",
    ]);
  });

  it("sorts by trophies descending, ties by name", () => {
    expect(names(sortBrawlers(list, "trophiesDesc"))).toEqual([
      "shelly",
      "Brock",
      "Bull",
      "Colt",
      "Rico",
    ]);
  });

  it("sorts by name ignoring case", () => {
    expect(names(sortBrawlers(list, "name"))).toEqual([
      "Brock",
      "Bull",
      "Colt",
      "Rico",
      "shelly",
    ]);
  });

  it("sorts by release order (id)", () => {
    expect(sortBrawlers(list, "release").map((b) => b.id)).toEqual([
      1, 2, 3, 4, 5,
    ]);
  });

  it("does not mutate the input", () => {
    const before = [...list];
    sortBrawlers(list, "name");
    expect(list).toEqual(before);
  });
});
