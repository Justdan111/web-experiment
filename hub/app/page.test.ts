import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(join(process.cwd(), "app", "page.tsx"), "utf8");

describe("index page", () => {
  it("never uses next/link — every experiment is a different container", () => {
    expect(source).not.toMatch(/from ["']next\/link["']/);
  });

  it("links every experiment with a plain anchor", () => {
    expect(source).toMatch(/<a\s+href=\{/);
  });
});
