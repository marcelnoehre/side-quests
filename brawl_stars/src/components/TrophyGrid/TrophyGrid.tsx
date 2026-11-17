import { Fragment, memo, useEffect, useMemo, useRef } from "react";
import type { CSSProperties } from "react";
import { STEP } from "../../config.ts";
import {
  fillFraction,
  stepGoal,
  stepIndex,
  stepStart,
} from "../../lib/buckets.ts";
import { stepColor, stepInk } from "../../lib/colors.ts";
import { goalBoundary, pushGoal } from "../../lib/stats.ts";
import type { Brawler, BrawlerMeta } from "../../types.ts";
import styles from "./TrophyGrid.module.css";

type Column = { step: number; color: string; ink: string };

type Props = {
  /** Owned brawlers, already sorted. */
  brawlers: readonly Brawler[];
  /** Locked brawlers to list at the bottom; empty to hide them. */
  locked: readonly BrawlerMeta[];
  columns: number;
  /** Median trophies across all brawlers; drawn as a guide line. */
  median: number;
  caption: string;
};

const vars = (values: Record<string, string | number>) =>
  values as CSSProperties;

const percent = (fraction: number) => `${(fraction * 100).toFixed(1)}%`;

const positionInStep = (trophies: number) => (trophies % STEP) / STEP;

export function TrophyGrid({
  brawlers,
  locked,
  columns,
  median,
  caption,
}: Props) {
  const cols = useMemo<Column[]>(
    () =>
      Array.from({ length: columns }, (_, step) => ({
        step,
        color: stepColor(step, columns),
        ink: stepInk(step, columns),
      })),
    [columns],
  );
  const medianStep = stepIndex(median);
  const { goal, remaining, remainingAverage, missingTrophies } = useMemo(
    () => pushGoal(brawlers),
    [brawlers],
  );
  const boundary = useMemo(
    () => goalBoundary(brawlers, goal),
    [brawlers, goal],
  );
  const medianAt = percent(positionInStep(median));

  // When the grid is wider than the screen, start at the first step that is still in
  // play instead of at columns every brawler has long completed.
  const scroller = useRef<HTMLDivElement>(null);
  const firstOpenStep = brawlers.reduce(
    (min, b) => Math.min(min, stepIndex(b.trophies)),
    Infinity,
  );
  useEffect(() => {
    const el = scroller.current;
    if (!el || !Number.isFinite(firstOpenStep) || firstOpenStep < 2) return;
    const headers = el.querySelectorAll<HTMLElement>("thead th");
    const target = headers[firstOpenStep]; // one completed step stays visible
    if (target) el.scrollLeft = target.offsetLeft - headers[0].offsetWidth;
  }, [firstOpenStep]);

  return (
    <div
      ref={scroller}
      className={styles.scroller}
      tabIndex={0}
      role="region"
      aria-label="Trophy grid"
    >
      <table
        className={styles.grid}
        style={vars({ "--columns": columns, "--median-at": medianAt })}
      >
        <caption className={styles.caption}>{caption}</caption>
        <colgroup>
          <col className={styles.headCol} />
          {cols.map((col) => (
            <col key={col.step} />
          ))}
        </colgroup>
        <thead>
          <tr>
            <th className={styles.corner} scope="col">
              <span className={styles.caption}>Brawler</span>
            </th>
            {cols.map((col) => (
              <th
                key={col.step}
                scope="col"
                className={col.step === medianStep ? styles.median : undefined}
                aria-label={`${stepStart(col.step)} to ${stepGoal(col.step)} trophies`}
              >
                <span
                  className={styles.step}
                  style={vars({ "--c": col.color, color: col.ink })}
                >
                  {stepGoal(col.step)}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {brawlers.map((brawler, index) => (
            <Fragment key={brawler.id}>
              {index === boundary && (
                <tr className={styles.divider}>
                  <td colSpan={columns + 1}>
                    <span className={styles.dividerLabel}>
                      Goal {goal} · {remaining} to go · avg {remainingAverage} ·{" "}
                      {missingTrophies} missing
                    </span>
                  </td>
                </tr>
              )}
              <BrawlerRow
                brawler={brawler}
                cols={cols}
                medianStep={medianStep}
              />
            </Fragment>
          ))}
          {locked.map((brawler) => (
            <LockedRow
              key={brawler.id}
              brawler={brawler}
              cols={cols}
              medianStep={medianStep}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

type RowProps = {
  brawler: Brawler;
  cols: readonly Column[];
  medianStep: number;
};

const BrawlerRow = memo(function BrawlerRow({
  brawler,
  cols,
  medianStep,
}: RowProps) {
  const { name, trophies, highestTrophies, power, winStreak } = brawler;
  const dropped = highestTrophies > trophies;
  const highestStep = stepIndex(highestTrophies);

  return (
    <tr>
      <th scope="row">
        <div className={styles.who}>
          <img
            className={styles.portrait}
            src={brawler.imageUrl}
            alt={name}
            width={34}
            height={34}
            loading="lazy"
          />
          <div className={styles.text}>
            <span className={styles.name}>{name}</span>
            <span className={styles.numbers}>
              <span className={styles.trophies}>{trophies}</span>
              {dropped && (
                <span
                  className={styles.extra}
                  title={`Highest: ${highestTrophies}`}
                >
                  ▲{highestTrophies}
                </span>
              )}
              <span
                className={`${styles.extra} ${styles.power}`}
                title={`Power level ${power}`}
              >
                <span className={styles.caption}>Power </span>
                {power}
              </span>
              {winStreak > 0 && (
                <span
                  className={`${styles.extra} ${styles.streak}`}
                  title={`Win streak: ${winStreak}`}
                >
                  <svg viewBox="0 0 16 16" width={12} height={12} aria-hidden>
                    <path d="M8 .5c.6 2.6 3.9 4.3 3.9 8.1A4 4 0 0 1 8 15.5a4 4 0 0 1-3.9-6.9c.2 1 .8 1.6 1.5 1.9C5.200 7.300 6.100 4.500 8 .5Z" />
                  </svg>
                  <span className={styles.caption}>Win streak </span>
                  {winStreak}
                </span>
              )}
            </span>
          </div>
        </div>
      </th>
      {cols.map((col) => {
        const fraction = fillFraction(trophies, col.step);
        const showTick = dropped && col.step === highestStep;
        const label =
          `${name}: ${stepStart(col.step)}–${stepGoal(col.step)}, at ${trophies}` +
          (showTick ? `, highest ${highestTrophies}` : "");
        const cellClass = [
          styles.cell,
          fraction > 0 && styles.reached,
          fraction > 0 && fraction < 1 && styles.partial,
        ]
          .filter(Boolean)
          .join(" ");

        return (
          <td
            key={col.step}
            className={col.step === medianStep ? styles.median : undefined}
            style={vars({ "--c": col.color })}
            title={label}
            aria-label={label}
          >
            <div className={cellClass}>
              {fraction > 0 && (
                <span
                  className={styles.fill}
                  style={
                    fraction < 1
                      ? vars({ "--fill": percent(fraction) })
                      : undefined
                  }
                />
              )}
              {showTick && (
                <span
                  className={styles.tick}
                  style={vars({
                    "--at": percent(positionInStep(highestTrophies)),
                  })}
                />
              )}
            </div>
          </td>
        );
      })}
    </tr>
  );
});

type LockedRowProps = {
  brawler: BrawlerMeta;
  cols: readonly Column[];
  medianStep: number;
};

const LockedRow = memo(function LockedRow({
  brawler,
  cols,
  medianStep,
}: LockedRowProps) {
  const label = `${brawler.name}: locked`;
  return (
    <tr className={styles.locked}>
      <th scope="row">
        <div className={styles.who}>
          <img
            className={styles.portrait}
            src={brawler.imageUrl}
            alt={brawler.name}
            width={34}
            height={34}
            loading="lazy"
          />
          <div className={styles.text}>
            <span className={styles.name}>{brawler.name}</span>
            <span className={styles.numbers}>Locked</span>
          </div>
        </div>
      </th>
      {cols.map((col) => (
        <td
          key={col.step}
          className={col.step === medianStep ? styles.median : undefined}
          title={label}
          aria-label={label}
        >
          <div className={styles.cell} />
        </td>
      ))}
    </tr>
  );
});
