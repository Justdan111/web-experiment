import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { experiments } from "./experiments";

const bodiesSource = readFileSync(
  join(process.cwd(), "content", "case-studies", "index.ts"),
  "utf8",
);

/** WCAG relative luminance. */
function luminance(hex: string): number {
  const channel = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  const n = parseInt(hex.slice(1), 16);
  return (
    0.2126 * channel((n >> 16) & 255) +
    0.7152 * channel((n >> 8) & 255) +
    0.0722 * channel(n & 255)
  );
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** The one ground. The hub is light only — there is no dark theme. */
const PAPER = "#FBFBF9";

/** Case studies are short by intent; this is the ceiling, not a target. */
const MAX_WORDS = 320;

describe("case studies", () => {
  it("gives every experiment a case study body on disk", () => {
    for (const e of experiments) {
      const path = join(process.cwd(), "content", "case-studies", `${e.slug}.mdx`);
      expect(existsSync(path), `${e.slug}.mdx`).toBe(true);
    }
  });

  it("registers every experiment's body in the map the route reads", () => {
    // A body file that exists but is never imported renders an empty page.
    for (const e of experiments) {
      expect(bodiesSource, e.slug).toMatch(new RegExp(`\\b${e.slug}\\b`));
    }
  });

  it("keeps every case study short enough to actually be read", () => {
    for (const e of experiments) {
      const body = readFileSync(
        join(process.cwd(), "content", "case-studies", `${e.slug}.mdx`),
        "utf8",
      );
      const words = body.split(/\s+/).filter(Boolean).length;
      expect(words, `${e.slug}: ${words} words`).toBeLessThanOrEqual(MAX_WORDS);
    }
  });

  it("gives every case study the summary the page header renders", () => {
    for (const e of experiments) {
      expect(e.caseStudy.summary.trim(), e.slug).not.toBe("");
    }
  });

  it("lists the stack each experiment was built with", () => {
    for (const e of experiments) {
      expect(e.caseStudy.stack.length, e.slug).toBeGreaterThan(0);
      for (const item of e.caseStudy.stack) {
        expect(item.trim(), e.slug).not.toBe("");
      }
    }
  });

  it("uses six-digit hex for both accent variants", () => {
    for (const e of experiments) {
      expect(e.caseStudy.accent, e.slug).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(e.caseStudy.accentInk, e.slug).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });

  it("keeps accentInk readable as small text on the ground", () => {
    // fort's brand lime (#ccff00) is invisible on paper. accentInk carries
    // links and button text; accent is only ever a rule or large type.
    for (const e of experiments) {
      expect(contrast(e.caseStudy.accentInk, PAPER), e.slug).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("keeps accent visible as a rule on the ground", () => {
    // 3:1 is the WCAG threshold for a non-text graphic like the title rule.
    for (const e of experiments) {
      expect(contrast(e.caseStudy.accent, PAPER), e.slug).toBeGreaterThanOrEqual(3);
    }
  });
});

describe("case study route", () => {
  it("pre-renders one page per experiment", async () => {
    const { caseStudyParams } = await import("./case-studies/params");
    expect(caseStudyParams()).toEqual(experiments.map((e) => ({ slug: e.slug })));
  });
});
