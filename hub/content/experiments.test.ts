import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { experiments } from "./experiments";

const repoRoot = join(process.cwd(), "..");

describe("experiments", () => {
  it("lists at least the two experiments that exist today", () => {
    expect(experiments.length).toBeGreaterThanOrEqual(2);
  });

  it("gives every experiment a unique slug", () => {
    expect(new Set(experiments.map((e) => e.slug)).size).toBe(experiments.length);
  });

  it("uses slugs that survive being turned into a CI secret name", () => {
    // The workflow derives DOKPLOY_WEBHOOK_<SLUG>; a hyphen would break it.
    for (const e of experiments) {
      expect(e.slug, e.slug).toMatch(/^[a-z0-9]+$/);
    }
  });

  it("never uses a slug the hub reserves for itself", () => {
    // The hub answers /notes/*, /posters/*, /_next/* and /favicon.ico at the
    // root. An experiment folder named e.g. "notes" would get a Traefik
    // PathPrefix that wins on length and takes that path from the hub.
    const reserved = new Set(["notes", "posters", "_next", "favicon.ico"]);
    for (const e of experiments) {
      expect(reserved.has(e.slug), e.slug).toBe(false);
    }
  });

  it("points each entry at a folder that actually exists in the repo", () => {
    for (const e of experiments) {
      expect(existsSync(join(repoRoot, e.slug)), e.slug).toBe(true);
    }
  });

  it("derives href from slug, with the trailing slash the apps expect", () => {
    // The experiments set trailingSlash: true; linking without it costs a redirect.
    for (const e of experiments) {
      expect(e.href, e.slug).toBe(`/${e.slug}/`);
    }
  });

  it("has a poster file on disk for every entry", () => {
    for (const e of experiments) {
      expect(existsSync(join(process.cwd(), "public", e.poster)), e.poster).toBe(true);
    }
  });

  it("leaves no per-slug page under app/notes — one route renders them all", () => {
    // Case studies moved to content/case-studies/<slug>.mdx behind
    // app/notes/[slug]/page.tsx. A leftover app/notes/<slug>/page.mdx would
    // win over the dynamic segment and render without the designed chrome.
    for (const e of experiments) {
      const stale = join(process.cwd(), "app", "notes", e.slug, "page.mdx");
      expect(existsSync(stale), `stale ${e.slug}/page.mdx`).toBe(false);
    }
  });

  it("gives every entry non-empty copy", () => {
    for (const e of experiments) {
      expect(e.title.trim(), e.slug).not.toBe("");
      expect(e.blurb.trim(), e.slug).not.toBe("");
      expect(e.tags.length, e.slug).toBeGreaterThan(0);
    }
  });
});
