export type RailConfig = {
  /** How many cards ride the rail. */
  count: number;
  cardWidth: number;
  /**
   * Distance between card edges, in rail space — before the projection.
   * Perspective compresses the strip as it recedes, so a tenth of overlap
   * here lands as the reference's roughly one-sixth on screen. Overlapping
   * a full fifth in rail space collapses them into one accordion.
   */
  gap: number;
};

export type RailCard = {
  index: number;
  x: number;
};

/**
 * Cards are 3:4 portrait, as the reference's are. Derived rather than
 * configured so the aspect cannot drift on one breakpoint and not another.
 */
export const CARD_ASPECT = 4 / 3;

export function cardHeight(config: RailConfig): number {
  return Math.round(config.cardWidth * CARD_ASPECT);
}

export const DESKTOP_RAIL: RailConfig = {
  count: 12,
  cardWidth: 220,
  gap: -20,
};

export const TABLET_RAIL: RailConfig = {
  count: 10,
  cardWidth: 190,
  gap: -17,
};

export const MOBILE_RAIL: RailConfig = {
  count: 8,
  cardWidth: 150,
  gap: -14,
};

/**
 * Card positions along the rail.
 *
 * x only, and deliberately so. The cards sit on one straight line at a
 * single height: the diagonal is the row's own rotateZ rather than a
 * per-card vertical step, and the size falloff is the perspective rather
 * than a per-card scale. Jittering either would only fight the projection.
 */
export function railLayout(config: RailConfig): RailCard[] {
  const step = config.cardWidth + config.gap;
  return Array.from({ length: config.count }, (_, index) => ({
    index,
    x: index * step,
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
