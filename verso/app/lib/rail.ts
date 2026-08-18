export type RailConfig = {
  /** How many cards ride the rail. */
  count: number;
  cardWidth: number;
  /**
   * Distance between pane edges, in rail space. Each pane is turned about
   * its own Y axis, so it projects at cos(ROTATE_Y) of its width — the gap
   * has to open up accordingly to still land on a fifth of *projected*
   * overlap, which is what the reference measures.
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
  cardWidth: 240,
  gap: -66,
};

export const TABLET_RAIL: RailConfig = {
  count: 10,
  cardWidth: 208,
  gap: -57,
};

export const MOBILE_RAIL: RailConfig = {
  count: 8,
  cardWidth: 168,
  gap: -46,
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

/**
 * How far each pane is turned about its own vertical axis, in degrees.
 *
 * Per pane rather than on the row: a 650px perspective applied to a
 * rotated row would drive the far end of the strip to a fraction of the
 * near end, where turning each pane in place leaves them all the same
 * distance from the camera and so the same size.
 */
export const ROTATE_Y = 30;

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
