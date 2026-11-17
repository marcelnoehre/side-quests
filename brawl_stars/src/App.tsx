import { useEffect, useMemo, useState } from "react";
import styles from "./App.module.css";
import { Summary } from "./components/Summary/Summary.tsx";
import { TrophyGrid } from "./components/TrophyGrid/TrophyGrid.tsx";
import { columnCount } from "./lib/buckets.ts";
import { DEFAULT_SORT, SORT_MODES, sortBrawlers } from "./lib/sort.ts";
import type { SortMode } from "./lib/sort.ts";
import { medianTrophies } from "./lib/stats.ts";
import type { PlayerData } from "./types.ts";

const DATA_URL = `${import.meta.env.BASE_URL}data/player.json`;

const SORT_LABELS: Record<SortMode, string> = {
  trophiesAsc: "Lowest first",
  trophiesDesc: "Highest first",
  name: "Name",
  release: "Release order",
};

/** Read the static data file, bypassing the browser cache. */
async function loadData(): Promise<PlayerData> {
  const response = await fetch(DATA_URL, { cache: "no-store" });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = (await response.json()) as PlayerData;
  if (!Array.isArray(data.brawlers)) throw new Error("Bad data");
  return data;
}

type LoadState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; data: PlayerData; loadedAt: number };

export default function App() {
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [sortMode, setSortMode] = useState<SortMode>(DEFAULT_SORT);
  const [showLocked, setShowLocked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadData()
      .then((data) => {
        if (!cancelled) {
          setState({ status: "ready", data, loadedAt: Date.now() });
        }
      })
      .catch(() => {
        if (!cancelled) setState({ status: "error" });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const data = state.status === "ready" ? state.data : undefined;
  const derived = useMemo(() => {
    if (!data) return undefined;
    return {
      sorted: sortBrawlers(data.brawlers, sortMode),
      columns: columnCount(data.brawlers),
      median: medianTrophies(data.brawlers),
    };
  }, [data, sortMode]);

  if (state.status === "loading") {
    return (
      <main className={styles.app}>
        <p className={styles.message} role="status">
          Loading trophies…
        </p>
      </main>
    );
  }

  if (state.status === "error" || !derived) {
    return (
      <main className={styles.app}>
        <p className={styles.message} role="alert">
          <strong>Data couldn't be loaded.</strong>
          The last refresh failed; check the fetch workflow.
        </p>
      </main>
    );
  }

  const { brawlers, locked } = state.data;

  return (
    <main className={styles.app}>
      <Summary
        data={state.data}
        columns={derived.columns}
        now={state.loadedAt}
      />

      <div className={styles.controls}>
        <p className={styles.legend}>
          <span>┊ median ({derived.median})</span>
          <span>▏ highest reached</span>
        </p>
        <div className={styles.options}>
          {locked.length > 0 && (
            <label>
              <input
                type="checkbox"
                checked={showLocked}
                onChange={(event) => setShowLocked(event.target.checked)}
              />
              Show locked ({locked.length})
            </label>
          )}
          <label>
            Sort
            <select
              value={sortMode}
              onChange={(event) => setSortMode(event.target.value as SortMode)}
            >
              {SORT_MODES.map((mode) => (
                <option key={mode} value={mode}>
                  {SORT_LABELS[mode]}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <TrophyGrid
        brawlers={derived.sorted}
        locked={showLocked ? locked : []}
        columns={derived.columns}
        median={derived.median}
        caption={`Trophy progress of ${brawlers.length} brawlers in steps of 100`}
      />
    </main>
  );
}
