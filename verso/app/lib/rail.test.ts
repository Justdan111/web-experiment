import { describe, expect, it } from "vitest";
import {
  DESKTOP_RAIL,
  MOBILE_RAIL,
  TABLET_RAIL,
  cardHeight,
  railLayout,
  railSpan,
  wrapX,
} from "./rail";

describe("rail configs", () => {
  it("thins the rail out as the viewport narrows", () => {
    expect(DESKTOP_RAIL.count).toBe(12);
    expect(TABLET_RAIL.count).toBe(10);
    expect(MOBILE_RAIL.count).toBe(8);
  });
});

describe("railLayout", () => {
  it("returns one card per configured slot", () => {
    expect(railLayout(DESKTOP_RAIL)).toHaveLength(12);
    expect(railLayout(MOBILE_RAIL)).toHaveLength(8);
  });

  it("spaces cards evenly by width plus gap", () => {
    const cards = railLayout(DESKTOP_RAIL);
    const step = DESKTOP_RAIL.cardWidth + DESKTOP_RAIL.gap;
    expect(cards[0].x).toBe(0);
    expect(cards[1].x).toBe(step);
    expect(cards[5].x).toBe(step * 5);
  });

  it("is deterministic, so server and client agree", () => {
    expect(railLayout(DESKTOP_RAIL)).toEqual(railLayout(DESKTOP_RAIL));
  });

  it("lays every card on one straight line", () => {
    // The diagonal is the row's rotateZ, not a per-card vertical step, so
    // x is the only thing layout decides. A y here would fight the
    // projection rather than add to it.
    const cards = railLayout(DESKTOP_RAIL);
    expect(cards.every((c) => Object.keys(c).sort().join() === "index,x")).toBe(true);
  });

  it("opens the rail-space gap to allow for per-pane foreshortening", () => {
    const step = DESKTOP_RAIL.cardWidth + DESKTOP_RAIL.gap;
    expect(1 - step / DESKTOP_RAIL.cardWidth).toBeCloseTo(0.275, 3);
  });
});

describe("cardHeight", () => {
  it("holds every breakpoint to the same 3:4 portrait", () => {
    for (const c of [DESKTOP_RAIL, TABLET_RAIL, MOBILE_RAIL]) {
      expect(cardHeight(c) / c.cardWidth).toBeCloseTo(4 / 3, 2);
    }
  });
});

describe("railSpan", () => {
  it("measures the full loop distance", () => {
    const step = DESKTOP_RAIL.cardWidth + DESKTOP_RAIL.gap;
    expect(railSpan(DESKTOP_RAIL)).toBe(step * DESKTOP_RAIL.count);
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

  it("is exactly periodic, so a recycling card lands where its predecessor was", () => {
    // The real no-jump guarantee: shifting by a whole span is a no-op.
    for (const x of [0, 1, 250.5, 999.999, -37, -1000.5]) {
      expect(wrapX(x + span, span)).toBeCloseTo(wrapX(x, span), 10);
    }
  });

  it("lands just inside the seam rather than on it", () => {
    // wrapX never returns span itself — the top of the range is open.
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
