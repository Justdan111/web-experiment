import { describe, expect, it } from "vitest";
import { CATEGORIES, countsFor, experiments } from "./experiments";

describe("experiments", () => {
  it("has fourteen", () => {
    expect(experiments).toHaveLength(14);
  });

  it("gives every experiment a unique slug", () => {
    const slugs = experiments.map((e) => e.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("uses url-safe slugs", () => {
    for (const e of experiments) expect(e.slug).toMatch(/^[a-z0-9-]+$/);
  });

  it("gives every experiment a source", () => {
    for (const e of experiments) {
      expect(e.repo, e.slug).toMatch(/^https:\/\/github\.com\//);
    }
  });

  it("gives every web experiment somewhere to open", () => {
    // Either a path on this host, for the ones assembled into this site, or an
    // absolute URL for one hosted on its own.
    for (const e of experiments.filter((x) => x.platform === "web")) {
      expect(e.live, e.slug).toBeTruthy();
      expect(e.live, e.slug).toMatch(/^(\/[a-z0-9-]+\/|https:\/\/\S+)$/);
    }
  });

  it("gives no mobile experiment a live link", () => {
    // There is no site to open; the source is the thing to see.
    for (const e of experiments.filter((x) => x.platform === "mobile")) {
      expect(e.live, e.slug).toBeUndefined();
    }
  });

  it("splits eleven mobile and three web", () => {
    const { platform } = countsFor(experiments);
    expect(platform).toEqual({ mobile: 11, web: 3 });
  });

  it("counts every experiment into exactly one known category", () => {
    const { category } = countsFor(experiments);
    const total = CATEGORIES.reduce((n, c) => n + category[c], 0);
    expect(total).toBe(experiments.length);
  });

  it("gives every experiment two short notes and at least one tag", () => {
    for (const e of experiments) {
      expect(e.notes, e.slug).toHaveLength(2);
      for (const n of e.notes) {
        expect(
          n.body.split(/\s+/).length,
          `${e.slug}/${n.heading}`,
        ).toBeLessThanOrEqual(90);
      }
      expect(e.tags.length, e.slug).toBeGreaterThan(0);
    }
  });
});
