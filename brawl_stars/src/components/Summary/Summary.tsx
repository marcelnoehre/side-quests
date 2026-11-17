import { stepEnd, stepStart } from "../../lib/buckets.ts";
import { stepColor } from "../../lib/colors.ts";
import {
  averageTrophies,
  pushGoal,
  shareAtMedianStep,
  stepCounts,
} from "../../lib/stats.ts";
import { formatAge, isStale } from "../../lib/time.ts";
import type { PlayerData } from "../../types.ts";
import styles from "./Summary.module.css";

type Props = {
  data: PlayerData;
  columns: number;
  /** Timestamp to measure the data's age against. */
  now: number;
};

export function Summary({ data, columns, now }: Props) {
  const { player, brawlers, fetchedAt } = data;
  const { threshold, share } = shareAtMedianStep(brawlers);
  const counts = stepCounts(brawlers);
  const { goal, remaining, remainingAverage, missingTrophies } =
    pushGoal(brawlers);
  const stale = isStale(fetchedAt, now);

  return (
    <header className={styles.summary}>
      <div className={styles.top}>
        {player.iconUrl && (
          <img
            className={styles.icon}
            src={player.iconUrl}
            alt=""
            width={40}
            height={40}
          />
        )}
        <div className={styles.identity}>
          <h1 className={styles.name}>
            {player.name}
            <span className={styles.tag}>{player.tag}</span>
          </h1>
          <span className={stale ? styles.stale : styles.updated}>
            Updated {formatAge(fetchedAt, now)}
            {stale &&
              ". Data is over 24 h old; the last refresh may have failed."}
          </span>
        </div>

        <dl className={styles.stats}>
          <div>
            <dt>Brawler Average</dt>
            <dd>{averageTrophies(brawlers)}</dd>
          </div>
          <div>
            <dt>Below {goal}</dt>
            <dd>{remaining}</dd>
          </div>
          <div
            title={`Average trophies of the ${remaining} brawlers below ${goal}`}
          >
            <dt>To-go Average</dt>
            <dd>{remainingAverage}</dd>
          </div>
          <div title={`Trophies needed to get every brawler to ${goal}`}>
            <dt>Trophies To-go</dt>
            <dd>{missingTrophies}</dd>
          </div>
          <div>
            <dt>At {threshold}+</dt>
            <dd>{Math.round(share * 100)}%</dd>
          </div>
          {player.totalPrestigeLevel !== undefined && (
            <div title="Total prestige level across all brawlers">
              <dt>Prestige</dt>
              <dd>{player.totalPrestigeLevel}</dd>
            </div>
          )}
          <div>
            <dt>Brawlers</dt>
            <dd>{brawlers.length}</dd>
          </div>
        </dl>
      </div>

      <ul className={styles.bar} aria-label="Brawlers per 100-trophy step">
        {counts.map(({ step, count }) => {
          const label = `${stepStart(step)}–${stepEnd(step)}: ${count} ${
            count === 1 ? "brawler" : "brawlers"
          }`;
          return (
            <li
              key={step}
              title={label}
              aria-label={label}
              style={{ flexGrow: count, background: stepColor(step, columns) }}
            />
          );
        })}
      </ul>
    </header>
  );
}
