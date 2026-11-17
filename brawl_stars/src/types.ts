/** Shape of `public/data/player.json`, written by `scripts/fetch-data.mjs`. */

export type Brawler = {
  id: number;
  name: string;
  trophies: number;
  highestTrophies: number;
  /** Shown small, not central. */
  power: number;
  /** Current win streak with this brawler. */
  winStreak: number;
  /** Brawlify CDN, by brawler id. */
  imageUrl: string;
  owned: true;
};

/** A brawler that exists in the game but is not owned by the player. */
export type BrawlerMeta = {
  id: number;
  name: string;
  imageUrl: string;
};

export type PlayerData = {
  /** ISO timestamp */
  fetchedAt: string;
  player: {
    tag: string;
    name: string;
    nameColor?: string;
    trophies: number;
    highestTrophies: number;
    /** Sum of the prestige levels of all brawlers, as reported by the API. */
    totalPrestigeLevel?: number;
    iconUrl?: string;
  };
  brawlers: Brawler[];
  locked: BrawlerMeta[];
};
