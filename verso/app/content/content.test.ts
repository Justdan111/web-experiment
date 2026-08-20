import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { FIELD_WORKS, PRACTICE_WORKS, WORKS } from "./works";
import { NEWS } from "./news";
import { CLOCKS, FOOTER_COLUMNS, NAV, REEL } from "./site";

const BADGES = new Set(["T", "E", "P", "I", "W"]);
const publicPath = (p: string) => join(process.cwd(), "public", p);

describe("WORKS", () => {
  it("has the twelve works the highlight rail needs", () => {
    expect(WORKS).toHaveLength(12);
  });

  it("gives every work a unique slug", () => {
    expect(new Set(WORKS.map((w) => w.slug)).size).toBe(WORKS.length);
  });

  it("gives every work non-empty copy", () => {
    for (const w of WORKS) {
      expect(w.title.trim(), w.slug).not.toBe("");
      expect(w.subtitle.trim(), w.slug).not.toBe("");
    }
  });

  it("only uses badge letters the card legend defines", () => {
    for (const w of WORKS) {
      expect(w.badges.length, w.slug).toBeGreaterThan(0);
      for (const b of w.badges) expect(BADGES.has(b), `${w.slug}: ${b}`).toBe(true);
    }
  });

  it("points every work at an image that exists on disk", () => {
    for (const w of WORKS) {
      expect(existsSync(publicPath(w.image)), w.image).toBe(true);
    }
  });
});

describe("section selections", () => {
  it("shows three works in each grid", () => {
    expect(FIELD_WORKS).toHaveLength(3);
    expect(PRACTICE_WORKS).toHaveLength(3);
  });

  it("draws both grids from WORKS", () => {
    const slugs = new Set(WORKS.map((w) => w.slug));
    for (const w of [...FIELD_WORKS, ...PRACTICE_WORKS]) {
      expect(slugs.has(w.slug), w.slug).toBe(true);
    }
  });

  it("gives each grid exactly one wide card", () => {
    expect(FIELD_WORKS.filter((w) => w.wide)).toHaveLength(1);
    expect(PRACTICE_WORKS.filter((w) => w.wide)).toHaveLength(1);
  });
});

describe("NEWS", () => {
  it("has the four entries the grid shows", () => {
    expect(NEWS).toHaveLength(4);
  });

  it("points every entry at an image that exists on disk", () => {
    for (const n of NEWS) {
      expect(existsSync(publicPath(n.image)), n.image).toBe(true);
    }
  });

  it("formats every date as M/D/YY", () => {
    for (const n of NEWS) {
      expect(n.date, n.slug).toMatch(/^\d{1,2}\/\d{1,2}\/\d{2}$/);
    }
  });
});

describe("site chrome", () => {
  it("lists the five divisions in the nav", () => {
    expect(NAV.map((n) => n.label)).toEqual([
      "Field",
      "Practice",
      "Foundry",
      "Index",
      "Goods",
    ]);
  });

  it("splits the footer into two five-item columns", () => {
    expect(FOOTER_COLUMNS).toHaveLength(2);
    for (const col of FOOTER_COLUMNS) expect(col).toHaveLength(5);
  });

  it("pairs a visitor-local clock with the Kyoto studio clock", () => {
    expect(CLOCKS).toHaveLength(2);
    expect(CLOCKS[0].timeZone).toBeNull();
    expect(CLOCKS[1].timeZone).toBe("Asia/Tokyo");
  });
});

describe("REEL", () => {
  it("points every beat at a work that exists", () => {
    // The hero component throws at module load on an unknown slug, which
    // fails the build rather than the suite. Catch it here instead.
    const slugs = new Set(WORKS.map((w) => w.slug));
    for (const beat of REEL) {
      expect(slugs.has(beat.slug), beat.slug).toBe(true);
    }
  });

  it("gives every beat a word", () => {
    for (const beat of REEL) {
      expect(beat.word.trim(), beat.slug).not.toBe("");
    }
  });

  it("closes on exactly one wordmark beat", () => {
    expect(REEL.filter((b) => b.mark)).toHaveLength(1);
    expect(REEL[REEL.length - 1].mark).toBe(true);
  });
});
