import { readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join } from "node:path";
import { describe, expect, it } from "vitest";

function* tsxFiles(dir: string): Generator<string> {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) yield* tsxFiles(path);
    else if (extname(path) === ".tsx") yield path;
  }
}

const files = [...tsxFiles(join(process.cwd(), "app"))];

describe("hub links", () => {
  it("has files to check", () => {
    // Guards against the scan silently passing because it found nothing.
    expect(files.length).toBeGreaterThan(0);
  });

  it("never uses next/link anywhere in the app", () => {
    // Deliberately a blanket rule rather than a targeted one. Every experiment
    // is served by a different container, so client-navigating to one breaks;
    // the previous version of this test asserted that against app/page.tsx by
    // path, and would have stopped enforcing anything the moment the card
    // markup moved into its own component file — which it since has.
    //
    // Internal hub routes could legitimately use next/link, but the hub is a
    // static export with a handful of pages: prefetch buys nothing here, and a
    // rule with no exceptions cannot silently stop applying.
    const offenders = files.filter((f) =>
      /from\s+["']next\/link["']/.test(readFileSync(f, "utf8")),
    );
    expect(offenders).toEqual([]);
  });

  it("links every experiment with a plain anchor", () => {
    const source = files.map((f) => readFileSync(f, "utf8")).join("\n");
    expect(source).toMatch(/<a\s+href=\{/);
  });
});
