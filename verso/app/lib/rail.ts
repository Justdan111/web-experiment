export type RailConfig = {
  /** How many panes ride the rail. */
  count: number;
  cardWidth: number;
  /** Positive: clear background between panes. */
  gap: number;
};

export type RailCard = {
  index: number;
  x: number;
};

/** How many panes are on screen at rest. */
export const VISIBLE = 7;

/**
 * Ten panes for seven on screen.
 *
 * The extra three are never all visible; they exist so the strip is wider
 * than the viewport and a pane always has somewhere off screen to recycle.
 * At exactly seven there is no slack, and the wrap opens a hole at the
 * seam as the strip travels.
 */
export const COUNT = 10;

/**
 * Space between panes as a fraction of pane width. Positive: they no
 * longer touch, so the background reads between them and they stand as
 * separate panes rather than a stacked deck.
 */
export const GAP_RATIO = 0.12;

/**
 * How far each pane is turned about its own vertical axis, in degrees.
 *
 * Per pane rather than on the row: one shared perspective projects from a
 * single point, so panes far from it shear and shrink. Turning each in
 * place against its own perspective projects them all head-on — same
 * taper, same size — which is nearer to what the WebGL original does.
 */
export const ROTATE_Y = 15;

/**
 * Pane width as a fraction of the viewport, derived rather than dialled in
 * so VISIBLE panes keep filling the viewport whatever the gap or turn.
 *
 * VISIBLE panes separated by GAP_RATIO span VISIBLE + (VISIBLE-1) x GAP
 * pane widths. The Y turn then projects each at cos(ROTATE_Y) of its
 * width, so dividing through by that lands the last pane's edge on the
 * viewport edge rather than short of it.
 */
export const CARD_VW =
  1 / ((VISIBLE + (VISIBLE - 1) * GAP_RATIO) * Math.cos((ROTATE_Y * Math.PI) / 180));

/** Panes are 3:4 portrait, as the reference's are. */
export const CARD_ASPECT = 4 / 3;

/** The width the server renders at, before the client knows the viewport. */
export const SSR_WIDTH = 1440;

export function railConfig(viewportWidth: number): RailConfig {
  const cardWidth = Math.round(viewportWidth * CARD_VW);
  return { count: COUNT, cardWidth, gap: Math.round(cardWidth * GAP_RATIO) };
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
