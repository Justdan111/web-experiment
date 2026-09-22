import { describe, expect, it } from "vitest";
import { experiments, numberOf, relatedTo, runFor } from "./experiments";

const bySlug = (slug: string) => {
  const e = experiments.find((x) => x.slug === slug);
  if (!e) throw new Error(`no experiment ${slug}`);
  return e;
};

describe("runFor", () => {
  it("clones the mobile repo and starts Expo", () => {
    expect(runFor(bySlug("moodlift")).lines).toEqual([
      "git clone https://github.com/Justdan111/mobile-interaction.git",
      "cd mobile-interaction/moodlift",
      "npm install",
      "npm start",
    ]);
  });

  it("quotes a folder the shell would split on a space", () => {
    // "travel app" is one directory; unquoted, cd takes two arguments.
    expect(runFor(bySlug("travel")).lines[1]).toBe(
      'cd "mobile-interaction/travel app"',
    );
  });

  it("keeps the separator in a nested folder", () => {
    expect(runFor(bySlug("sora")).lines[1]).toBe("cd mobile-interaction/aiagent/sora");
  });

  it("clones the web repo and runs next for a web experiment", () => {
    expect(runFor(bySlug("verso")).lines).toEqual([
      "git clone https://github.com/Justdan111/web-experiment.git",
      "cd web-experiment/verso",
      "pnpm install",
      "pnpm dev",
    ]);
  });

  it("clones an experiment's own repo, with no folder to step into", () => {
    // Grey Room is not assembled into this site; it is its own repo and its
    // own deployment, so there is no subdirectory after the clone.
    expect(runFor(bySlug("greyroom")).lines.slice(0, 2)).toEqual([
      "git clone https://github.com/Justdan111/grey-room.git",
      "cd grey-room",
    ]);
    expect(bySlug("greyroom").repo).toBe("https://github.com/Justdan111/grey-room");
  });

  it("uses the dev build for the one app Expo Go cannot run", () => {
    const run = runFor(bySlug("widget"));
    expect(run.lines.at(-1)).toBe("npx expo run:ios");
    expect(run.note).toMatch(/Expo Go/);
  });

  it("gives every experiment four lines and a note", () => {
    for (const e of experiments) {
      const run = runFor(e);
      expect(run.lines, e.slug).toHaveLength(4);
      expect(run.note.length, e.slug).toBeGreaterThan(0);
    }
  });
});

describe("repo links", () => {
  it("url-encodes a space in a folder without encoding the separators", () => {
    expect(bySlug("travel").repo).toBe(
      "https://github.com/Justdan111/mobile-interaction/tree/main/travel%20app",
    );
    expect(bySlug("sora").repo).toBe(
      "https://github.com/Justdan111/mobile-interaction/tree/main/aiagent/sora",
    );
  });
});

describe("numberOf", () => {
  it("is the permanent position in the full list, one-based", () => {
    expect(numberOf(experiments[0])).toBe(1);
    expect(numberOf(experiments[12])).toBe(13);
  });
});

describe("relatedTo", () => {
  it("never includes the experiment itself", () => {
    for (const e of experiments) {
      expect(relatedTo(e).map((x) => x.slug), e.slug).not.toContain(e.slug);
    }
  });

  it("returns three for every experiment", () => {
    for (const e of experiments) {
      expect(relatedTo(e), e.slug).toHaveLength(3);
    }
  });

  it("prefers the same category before filling from the rest", () => {
    // Sushi is Full flows, of which there are three — so both others come first.
    const related = relatedTo(bySlug("sushi"));
    expect(related.slice(0, 2).every((e) => e.category === "Full flows")).toBe(true);
  });

  it("still returns three when a category has no other members", () => {
    const related = relatedTo(bySlug("moodlift"), 3);
    expect(new Set(related.map((e) => e.slug)).size).toBe(3);
  });
});
