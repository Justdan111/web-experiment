import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { experiments } from "./experiments";

/** The list lives in the component; read it rather than duplicating it here. */
const featured = (() => {
  const src = readFileSync(join(process.cwd(), "app/components/Featured.tsx"), "utf8");
  const match = src.match(/const FEATURED = \[([^\]]+)\]/);
  if (!match) throw new Error("could not find FEATURED in Featured.tsx");
  return [...match[1].matchAll(/"([a-z0-9-]+)"/g)].map((m) => m[1]);
})();

describe("featured", () => {
  it("names three experiments", () => {
    expect(featured).toHaveLength(3);
  });

  it("names only real experiments", () => {
    const slugs = new Set(experiments.map((e) => e.slug));
    for (const slug of featured) expect(slugs.has(slug), slug).toBe(true);
  });

  it("gives every featured experiment a clip", () => {
    // The rail plays these large, first thing on the page. A placeholder here
    // reads as a broken site, not as a recording that has not been made yet.
    for (const slug of featured) {
      const e = experiments.find((x) => x.slug === slug)!;
      expect(e.media.video, `${slug} is featured but has no clip`).toBeTruthy();
    }
  });
});
