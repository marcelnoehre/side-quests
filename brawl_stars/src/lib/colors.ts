type Oklch = { l: number; c: number; h: number };

/**
 * The trophy ramp, from the bottom of the ladder to the top. It is stretched over
 * however many columns the data needs, so there is no trophy cap baked in.
 */
export const COLOR_STOPS: readonly Oklch[] = [
  { l: 0.5, c: 0.07, h: 55 }, // wood brown
  { l: 0.66, c: 0.12, h: 60 }, // bronze
  { l: 0.84, c: 0.02, h: 85 }, // silver
  { l: 0.86, c: 0.17, h: 92 }, // gold
  { l: 0.82, c: 0.13, h: 200 }, // cyan
  { l: 0.62, c: 0.21, h: 295 }, // violet
  { l: 0.62, c: 0.23, h: 25 }, // red
  { l: 0.4, c: 0.08, h: 85 }, // black-gold
];

export const INK_DARK = "#000000";
export const INK_LIGHT = "#ffffff";

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Interpolate hue along the shorter arc. */
function lerpHue(a: number, b: number, t: number): number {
  const delta = ((b - a + 540) % 360) - 180;
  return (a + delta * t + 360) % 360;
}

/** Colour of a step in a grid of `columns` columns, as OKLCH components. */
export function stepOklch(step: number, columns: number): Oklch {
  const lastStop = COLOR_STOPS.length - 1;
  const lastStep = Math.max(1, columns - 1);
  const position =
    (Math.min(Math.max(step, 0), lastStep) / lastStep) * lastStop;
  const i = Math.min(Math.floor(position), lastStop - 1);
  const from = COLOR_STOPS[i];
  const to = COLOR_STOPS[i + 1];
  const t = position - i;
  return {
    l: lerp(from.l, to.l, t),
    c: lerp(from.c, to.c, t),
    h: lerpHue(from.h, to.h, t),
  };
}

/** CSS colour of a step (grid column). */
export function stepColor(step: number, columns: number): string {
  const { l, c, h } = stepOklch(step, columns);
  return `oklch(${l.toFixed(3)} ${c.toFixed(3)} ${h.toFixed(1)})`;
}

/** Relative luminance (WCAG) of an OKLCH colour, clipped to sRGB. */
export function luminance({ l, c, h }: Oklch): number {
  const a = c * Math.cos((h * Math.PI) / 180);
  const b = c * Math.sin((h * Math.PI) / 180);
  const l_ = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m_ = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s_ = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const clip = (x: number) => Math.min(1, Math.max(0, x));
  const r = clip(4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_);
  const g = clip(-1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_);
  const bl = clip(-0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_);
  return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
}

/** WCAG contrast ratio between two relative luminances. */
export function contrast(y1: number, y2: number): number {
  const [hi, lo] = y1 > y2 ? [y1, y2] : [y2, y1];
  return (hi + 0.05) / (lo + 0.05);
}

const Y_DARK = 0;
const Y_LIGHT = 1;

/** Text colour with the better contrast on a step's colour. */
export function stepInk(step: number, columns: number): string {
  const y = luminance(stepOklch(step, columns));
  return contrast(y, Y_DARK) >= contrast(y, Y_LIGHT) ? INK_DARK : INK_LIGHT;
}

/** Contrast ratio of the chosen text colour on a step's colour. */
export function stepInkContrast(step: number, columns: number): number {
  const y = luminance(stepOklch(step, columns));
  return Math.max(contrast(y, Y_DARK), contrast(y, Y_LIGHT));
}
