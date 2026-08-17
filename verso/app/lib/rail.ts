export type RailConfig = {
  /** How many cards ride the rail. */
  count: number;
  cardWidth: number;
  /**
   * Distance between card edges. Negative on purpose — the reference's
   * cards overlap by roughly a third, which is what makes the strip read
   * as one continuous wall rather than a row of separate tiles.
   */
  gap: number;
  /** Max vertical wander, px, applied symmetrically. */
  yJitter: number;
  /** Max scale deviation from 1, applied symmetrically. */
  scaleJitter: number;
};

export type RailCard = {
  index: number;
  x: number;
  y: number;
  scale: number;
};

export const DESKTOP_RAIL: RailConfig = {
  count: 12,
  cardWidth: 280,
  gap: -100,
  yJitter: 48,
  scaleJitter: 0.08,
};

export const TABLET_RAIL: RailConfig = {
  count: 10,
  cardWidth: 240,
  gap: -86,
  yJitter: 36,
  scaleJitter: 0.06,
};

export const MOBILE_RAIL: RailConfig = {
  count: 8,
  cardWidth: 180,
  gap: -64,
  yJitter: 20,
  scaleJitter: 0.04,
};

/**
 * Deterministic pseudo-random in [0, 1) from an integer seed.
 *
 * Deliberately not Math.random: the layout has to be identical on every
 * call so the rail does not reshuffle on re-render.
 */
function noise(seed: number): number {
  const n = Math.sin(seed * 12.9898) * 43758.5453;
  return n - Math.floor(n);
}

/** Signed jitter in [-amount, amount]. */
function jitter(seed: number, amount: number): number {
  return (noise(seed) * 2 - 1) * amount;
}

/**
 * Card positions along the rail.
 *
 * All cards sit at z = 0 — the rail element carries the 3D rotation, so
 * perspective supplies the depth and the scale falloff. The jitter here is
 * only the organic wander on top of that.
 */
export function railLayout(config: RailConfig): RailCard[] {
  const step = config.cardWidth + config.gap;
  return Array.from({ length: config.count }, (_, index) => ({
    index,
    x: index * step,
    y: jitter(index + 1, config.yJitter),
    scale: 1 + jitter(index + 101, config.scaleJitter),
  }));
}

/**
 * Full width of the laid-out strip.
 *
 * The rail does not loop — it is parked, and scrolling through the section
 * slides it. This is how far it can travel before the last card arrives.
 */
export function railSpan(config: RailConfig): number {
  return (config.cardWidth + config.gap) * config.count;
}
