export type RailConfig = {
  /** How many cards ride the rail. */
  count: number;
  cardWidth: number;
  /**
   * Distance between card edges, in rail space — before the projection.
   * Perspective compresses the strip as it recedes, so a small positive
   * gap here lands as the reference's roughly one-sixth overlap on screen.
   * Overlapping in rail space collapses them into one accordion.
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
  cardWidth: 232,
  gap: 10,
  yJitter: 48,
  scaleJitter: 0.08,
};

export const TABLET_RAIL: RailConfig = {
  count: 10,
  cardWidth: 205,
  gap: 9,
  yJitter: 36,
  scaleJitter: 0.06,
};

export const MOBILE_RAIL: RailConfig = {
  count: 8,
  cardWidth: 165,
  gap: 7,
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

/** Total loop distance: shifting by this lands the strip back on itself. */
export function railSpan(config: RailConfig): number {
  return (config.cardWidth + config.gap) * config.count;
}

/**
 * Fold any x into [0, span).
 *
 * The strip loops forever under the cursor, so each card's x is folded
 * back into a single period. Exact periodicity is the whole point — see
 * the test — because a card that lands even a fraction off where its
 * predecessor was is a visible jump once a cycle.
 */
export function wrapX(x: number, span: number): number {
  return ((x % span) + span) % span;
}
