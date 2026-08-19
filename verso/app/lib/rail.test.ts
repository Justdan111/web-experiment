import { describe, expect, it } from "vitest";
import {
  CARD_ASPECT,
  COUNT,
  OVERLAP,
  cardHeight,
  railConfig,
  railLayout,
  railSpan,
  wrapX,
} from "./rail";

const AT_1440 = railConfig(1440);

describe("railConfig", () => {
  it("rides nine panes at every width", () => {
    for (const w of [375, 900, 1440, 2560]) {
      expect(railConfig(w).count).toBe(COUNT);
    }
  });

  it("scales the pane with the viewport", () => {
    expect(railConfig(1440).cardWidth).toBeGreaterThan(railConfig(375).cardWidth);
    expect(railConfig(1440).cardWidth / 1440).toBeCloseTo(railConfig(2560).cardWidth / 2560, 2);
  });

  it("sizes the pane so exactly seven fill the viewport", () => {
    // Seven panes overlapping by a fifth span 1 + 6 x 0.8 = 5.8 widths, so
    // the seventh's right edge should land on the viewport edge.
    for (const w of [1024, 1440, 1920]) {
      const c = railConfig(w);
      const run = c.cardWidth + 6 * (c.cardWidth + c.gap);
      expect(run / w).toBeCloseTo(1, 1);
    }
  });

  it("overlaps neighbours by a fifth of a pane", () => {
    const step = AT_1440.cardWidth + AT_1440.gap;
    expect(1 - step / AT_1440.cardWidth).toBeCloseTo(OVERLAP, 2);
  });
});

describe("cardHeight", () => {
  it("holds every width to the same 3:4 portrait", () => {
    // Compared against the rounded ideal rather than a ratio: at 375px a
    // pane is 65px wide, and whole pixels cannot express 4/3 exactly.
    for (const w of [375, 900, 1440]) {
      const c = railConfig(w);
      expect(cardHeight(c)).toBe(Math.round(c.cardWidth * CARD_ASPECT));
    }
  });
});

describe("railLayout", () => {
  it("returns one pane per configured slot", () => {
    expect(railLayout(AT_1440)).toHaveLength(COUNT);
  });

  it("spaces panes evenly by width plus gap", () => {
    const cards = railLayout(AT_1440);
    const step = AT_1440.cardWidth + AT_1440.gap;
    expect(cards[0].x).toBe(0);
    expect(cards[1].x).toBe(step);
    expect(cards[5].x).toBe(step * 5);
  });

  it("is deterministic, so server and client agree", () => {
    expect(railLayout(AT_1440)).toEqual(railLayout(AT_1440));
  });

  it("lays every pane on one straight line", () => {
    // The diagonal is the row's rotateZ, not a per-pane vertical step, so
    // x is the only thing layout decides. A y here would fight the
    // projection rather than add to it.
    const cards = railLayout(AT_1440);
    expect(cards.every((c) => Object.keys(c).sort().join() === "index,x")).toBe(true);
  });
});

describe("railSpan", () => {
  it("measures the full loop distance", () => {
    const step = AT_1440.cardWidth + AT_1440.gap;
    expect(railSpan(AT_1440)).toBe(step * COUNT);
  });
});

describe("wrapX", () => {
  const span = 1000;

  it("leaves a value inside the span untouched", () => {
    expect(wrapX(0, span)).toBe(0);
    expect(wrapX(400, span)).toBe(400);
  });

  it("wraps a value past the end back to the start", () => {
    expect(wrapX(1000, span)).toBe(0);
    expect(wrapX(1200, span)).toBe(200);
  });

  it("wraps a negative value up into the span", () => {
    expect(wrapX(-100, span)).toBe(900);
    expect(wrapX(-1100, span)).toBe(900);
  });

  it("is exactly periodic, so a recycling pane lands where its predecessor was", () => {
    for (const x of [0, 1, 250.5, 999.999, -37, -1000.5]) {
      expect(wrapX(x + span, span)).toBeCloseTo(wrapX(x, span), 10);
    }
  });

  it("lands just inside the seam rather than on it", () => {
    expect(wrapX(span - 0.001, span)).toBeCloseTo(span - 0.001, 10);
    expect(wrapX(0.001, span)).toBeCloseTo(0.001, 10);
  });

  it("always returns a value inside [0, span)", () => {
    for (const x of [-5000, -1, 0, 1, 999, 1000, 7777]) {
      const w = wrapX(x, span);
      expect(w).toBeGreaterThanOrEqual(0);
      expect(w).toBeLessThan(span);
    }
  });
});
