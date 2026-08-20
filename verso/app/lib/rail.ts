export type RailConfig = {
  /** How many panes ride the rail. */
  count: number;
  cardWidth: number;
  /** Negative: panes overlap by OVERLAP of their width. */
  gap: number;
};

export type RailCard = {
  index: number;
  x: number;
};

/** Nine panes; seven fill the viewport and the other two are a scroll away. */
export const COUNT = 9;

/**
 * Pane width as a fraction of the viewport.
 *
 * Seven panes overlapping by 8% occupy 1 + 6 x 0.92 = 6.52 pane widths,
 * so 1/6.52 = 0.153 — divided by cos(ROTATE_Y), since the turn foreshortens
 * each pane, which puts the seventh pane's right edge on the viewport edge.
 */
export const CARD_VW = 0.158;

/**
 * Fraction of its width each pane hides under its neighbour, measured
 * BEFORE the Y turn. The turn foreshortens each pane, so a fifth here
 * reads as nearer a third on screen — enough to fuse the strip into one
 * mass. At 8% it reads as a deck.
 */
export const OVERLAP = 0.08;

/**
 * How far each pane is turned about its own vertical axis, in degrees.
 *
 * Per pane rather than on the row: one shared perspective projects from a
 * single point, so panes far from it shear and shrink. Turning each in
 * place against its own perspective projects them all head-on — same
 * taper, same size — which is nearer to what the WebGL original does.
 */
export const ROTATE_Y = 15;

/** Panes are 3:4 portrait, as the reference's are. */
export const CARD_ASPECT = 4 / 3;

/** The width the server renders at, before the client knows the viewport. */
export const SSR_WIDTH = 1440;

export function railConfig(viewportWidth: number): RailConfig {
  const cardWidth = Math.round(viewportWidth * CARD_VW);
  return { count: COUNT, cardWidth, gap: -Math.round(cardWidth * OVERLAP) };
}

export function cardHeight(config: RailConfig): number {
  return Math.round(config.cardWidth * CARD_ASPECT);
}

/**
 * Pane positions along the rail.
 *
 * x only, and deliberately so. The panes sit on one straight line at a
 * single height: the diagonal is the row's own rotateZ rather than a
 * per-pane vertical step, and any size difference is the projection rather
 * than a per-pane scale. Jittering either would only fight them.
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
 * The strip loops forever under the cursor, so each pane's x is folded
 * back into a single period. Exact periodicity is the whole point — see
 * the test — because a pane that lands even a fraction off where its
 * predecessor was is a visible jump once a cycle.
 */
export function wrapX(x: number, span: number): number {
  return ((x % span) + span) % span;
}
