// Fetches the player and the list of all brawlers from the Brawl Stars API (through the
// RoyaleAPI proxy), trims and joins them, and writes public/data/player.json.
//
// Needs BRAWL_API_KEY (from the environment or a local .env). On any failure the script
// exits non-zero and leaves the existing JSON untouched.

import { mkdir, rename, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildPlayerData } from "./lib/transform.mjs";

// Keep in sync with PLAYER_TAG in src/config.ts.
const PLAYER_TAG = "#2QPU0PV9C";
const API_BASE = "https://bsproxy.royaleapi.dev/v1";
const TIMEOUT_MS = 30_000;

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outFile = join(root, "public", "data", "player.json");

/**
 * @param {string} path
 * @param {string} key
 */
async function getJson(path, key) {
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      headers: { Authorization: `Bearer ${key}`, Accept: "application/json" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (error) {
    const reason = error instanceof Error ? error.name : "unknown error";
    throw new Error(`GET ${path} failed: ${reason}`, { cause: error });
  }
  if (!response.ok) {
    // Only the API's short reason code is reported, never headers or the key.
    const body = await response.json().catch(() => null);
    const reason = typeof body?.reason === "string" ? ` (${body.reason})` : "";
    throw new Error(`GET ${path} failed: HTTP ${response.status}${reason}`);
  }
  return response.json();
}

async function main() {
  try {
    process.loadEnvFile(join(root, ".env"));
  } catch {
    // No .env file: the key has to come from the environment.
  }
  const key = process.env.BRAWL_API_KEY?.trim();
  if (!key) {
    throw new Error("BRAWL_API_KEY is not set (see .env.example)");
  }

  const [player, allBrawlers] = await Promise.all([
    getJson(`/players/${encodeURIComponent(PLAYER_TAG)}`, key),
    getJson("/brawlers", key),
  ]);
  const data = buildPlayerData(player, allBrawlers, new Date().toISOString());

  // Atomic write: a failed run never leaves a half-written file behind.
  await mkdir(dirname(outFile), { recursive: true });
  const tmpFile = `${outFile}.tmp`;
  try {
    await writeFile(tmpFile, JSON.stringify(data, null, 1) + "\n");
    await rename(tmpFile, outFile);
  } catch (error) {
    await rm(tmpFile, { force: true });
    throw error;
  }

  console.log(
    `Wrote public/data/player.json: ${data.brawlers.length} brawlers, ${data.locked.length} locked`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Fetch failed");
  process.exitCode = 1;
});
