// Pure helpers that turn raw API responses into the trimmed JSON the app reads.

/** @typedef {import("../../src/types.ts").PlayerData} PlayerData */

const CDN = "https://cdn.brawlify.com";

/** @param {number} id */
export function brawlerImageUrl(id) {
  return `${CDN}/brawlers/borderless/${id}.png`;
}

/** @param {number} id */
export function profileIconUrl(id) {
  return `${CDN}/profile-icons/regular/${id}.png`;
}

/**
 * The API sends names in capitals ("EL PRIMO", "8-BIT", "MR. P").
 * @param {string} name
 */
export function displayName(name) {
  return name
    .toLowerCase()
    .replace(/(^|[\s-])(\p{L})/gu, (_, sep, ch) => sep + ch.toUpperCase());
}

/**
 * The API sends colours as "0xAARRGGBB".
 * @param {unknown} value
 * @returns {string | undefined} CSS hex colour
 */
export function cssColor(value) {
  if (typeof value !== "string") return undefined;
  const match = /^0x[0-9a-f]{2}([0-9a-f]{6})$/i.exec(value);
  return match ? `#${match[1].toLowerCase()}` : undefined;
}

/**
 * @param {unknown} value
 * @param {string} what
 * @returns {number}
 */
function int(value, what) {
  if (!Number.isInteger(value)) {
    throw new Error(`Unexpected API response: ${what} is not an integer`);
  }
  return /** @type {number} */ (value);
}

/**
 * @param {unknown} value
 * @param {string} what
 * @returns {string}
 */
function str(value, what) {
  if (typeof value !== "string" || value === "") {
    throw new Error(`Unexpected API response: ${what} is not a string`);
  }
  return value;
}

/**
 * Join the player response with the list of all brawlers (on `id`) and keep only the
 * fields the app needs. Throws if the responses don't have the expected shape.
 *
 * @param {any} player response of GET /v1/players/{tag}
 * @param {any} allBrawlers response of GET /v1/brawlers
 * @param {string} fetchedAt ISO timestamp
 * @returns {PlayerData}
 */
export function buildPlayerData(player, allBrawlers, fetchedAt) {
  if (!Array.isArray(player?.brawlers) || player.brawlers.length === 0) {
    throw new Error("Unexpected API response: player has no brawlers");
  }
  if (!Array.isArray(allBrawlers?.items) || allBrawlers.items.length === 0) {
    throw new Error("Unexpected API response: brawler list is empty");
  }

  /** @type {PlayerData["brawlers"]} */
  const brawlers = player.brawlers.map((/** @type {any} */ b) => {
    const id = int(b.id, "brawler id");
    return {
      id,
      name: displayName(str(b.name, `name of brawler ${id}`)),
      trophies: int(b.trophies, `trophies of brawler ${id}`),
      highestTrophies: int(
        b.highestTrophies,
        `highestTrophies of brawler ${id}`,
      ),
      power: int(b.power, `power of brawler ${id}`),
      winStreak: int(b.currentWinStreak, `currentWinStreak of brawler ${id}`),
      imageUrl: brawlerImageUrl(id),
      owned: true,
    };
  });

  const owned = new Set(brawlers.map((b) => b.id));
  /** @type {PlayerData["locked"]} */
  const locked = allBrawlers.items
    .filter((/** @type {any} */ b) => !owned.has(b.id))
    .map((/** @type {any} */ b) => {
      const id = int(b.id, "brawler id");
      return {
        id,
        name: displayName(str(b.name, `name of brawler ${id}`)),
        imageUrl: brawlerImageUrl(id),
      };
    });

  const nameColor = cssColor(player.nameColor);
  const iconId = player.icon?.id;

  return {
    fetchedAt,
    player: {
      tag: str(player.tag, "player tag"),
      name: str(player.name, "player name"),
      ...(nameColor ? { nameColor } : {}),
      trophies: int(player.trophies, "player trophies"),
      highestTrophies: int(player.highestTrophies, "player highestTrophies"),
      ...(Number.isInteger(player.totalPrestigeLevel)
        ? { totalPrestigeLevel: player.totalPrestigeLevel }
        : {}),
      ...(Number.isInteger(iconId) ? { iconUrl: profileIconUrl(iconId) } : {}),
    },
    brawlers,
    locked,
  };
}
