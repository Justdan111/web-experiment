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

  it("sets notes: true exactly when the writeup file exists", () => {
    for (const e of experiments) {
      const hasFile = existsSync(join(process.cwd(), "app", "notes", e.slug, "page.mdx"));
      expect(hasFile, `${e.slug}: notes flag says ${e.notes}, file exists ${hasFile}`).toBe(e.notes);
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
