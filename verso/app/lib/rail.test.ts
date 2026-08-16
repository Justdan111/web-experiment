import { describe, expect, it } from "vitest";
import {
  DESKTOP_RAIL,
  MOBILE_RAIL,
  TABLET_RAIL,
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

  it("keeps vertical jitter inside its configured bound", () => {
    for (const c of railLayout(DESKTOP_RAIL)) {
      expect(Math.abs(c.y)).toBeLessThanOrEqual(DESKTOP_RAIL.yJitter);
    }
  });

  it("keeps scale jitter inside its configured bound", () => {
    for (const c of railLayout(DESKTOP_RAIL)) {
      expect(Math.abs(c.scale - 1)).toBeLessThanOrEqual(DESKTOP_RAIL.scaleJitter);
    }
  });

  it("does not place every card at the same height", () => {
    const ys = new Set(railLayout(DESKTOP_RAIL).map((c) => c.y));
    expect(ys.size).toBeGreaterThan(1);
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

  it("is continuous across the seam, so the loop never jumps", () => {
    const before = wrapX(span - 0.001, span);
    const after = wrapX(0.001, span);
    expect(before).toBeCloseTo(span, 2);
    expect(after).toBeCloseTo(0, 2);
  });

  it("always returns a value inside [0, span)", () => {
    for (const x of [-5000, -1, 0, 1, 999, 1000, 7777]) {
      const w = wrapX(x, span);
      expect(w).toBeGreaterThanOrEqual(0);
      expect(w).toBeLessThan(span);
    }
  });
});
