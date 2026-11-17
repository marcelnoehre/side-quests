import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { buildPlayerData, cssColor, displayName } from "./transform.mjs";

const fixture = (/** @type {string} */ name) =>
  JSON.parse(
    readFileSync(new URL(`../fixtures/${name}`, import.meta.url), "utf8"),
  );

const player = fixture("player.json");
const allBrawlers = fixture("brawlers.json");
const fetchedAt = "2026-11-13T09:00:00.000Z";

describe("displayName", () => {
  it("title-cases API names", () => {
    expect(displayName("SHELLY")).toBe("Shelly");
    expect(displayName("EL PRIMO")).toBe("El Primo");
    expect(displayName("8-BIT")).toBe("8-Bit");
    expect(displayName("MR. P")).toBe("Mr. P");
    expect(displayName("R-T")).toBe("R-T");
    expect(displayName("LARRY & LAWRIE")).toBe("Larry & Lawrie");
  });
});

describe("cssColor", () => {
  it("converts 0xAARRGGBB to a CSS hex colour", () => {
    expect(cssColor("0xffcb5aff")).toBe("#cb5aff");
  });

  it("returns undefined for anything else", () => {
    expect(cssColor(undefined)).toBeUndefined();
    expect(cssColor("red")).toBeUndefined();
  });
});

describe("buildPlayerData", () => {
  const data = buildPlayerData(player, allBrawlers, fetchedAt);

  it("keeps the player basics", () => {
    expect(data.fetchedAt).toBe(fetchedAt);
    expect(data.player.tag).toBe("#2QPU0PV9C");
    expect(data.player.name).toBe(player.name);
    expect(data.player.trophies).toBe(player.trophies);
    expect(data.player.totalPrestigeLevel).toBe(player.totalPrestigeLevel);
    expect(data.player.totalPrestigeLevel).toBeGreaterThan(0);
    expect(data.player.iconUrl).toContain(String(player.icon.id));
  });

  it("writes exactly the trimmed fields per brawler", () => {
    expect(data.brawlers).toHaveLength(player.brawlers.length);
    const raw = player.brawlers[0];
    expect(data.brawlers[0]).toEqual({
      id: raw.id,
      name: displayName(raw.name),
      trophies: raw.trophies,
      highestTrophies: raw.highestTrophies,
      power: raw.power,
      winStreak: raw.currentWinStreak,
      imageUrl: `https://cdn.brawlify.com/brawlers/borderless/${raw.id}.png`,
      owned: true,
    });
  });

  it("splits all brawlers into owned and locked by id", () => {
    const owned = new Set(data.brawlers.map((b) => b.id));
    expect(data.brawlers.length + data.locked.length).toBe(
      allBrawlers.items.length,
    );
    expect(data.locked.every((b) => !owned.has(b.id))).toBe(true);
  });

  it("joins on id, not on name", () => {
    const renamed = {
      items: allBrawlers.items.map((/** @type {any} */ b) => ({
        ...b,
        name: `X ${b.name}`,
      })),
    };
    const result = buildPlayerData(player, renamed, fetchedAt);
    expect(result.locked.map((b) => b.id)).toEqual(
      data.locked.map((b) => b.id),
    );
  });

  it("stores nothing about ranked", () => {
    expect(JSON.stringify(data).toLowerCase()).not.toContain("ranked");
  });

  it("rejects responses with an unexpected shape", () => {
    expect(() => buildPlayerData({}, allBrawlers, fetchedAt)).toThrow();
    expect(() => buildPlayerData(player, { items: [] }, fetchedAt)).toThrow();
    const broken = {
      ...player,
      brawlers: [{ ...player.brawlers[0], trophies: "12" }],
    };
    expect(() => buildPlayerData(broken, allBrawlers, fetchedAt)).toThrow(
      /trophies/,
    );
  });
});
