import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const dist = join(process.cwd(), "dist");

describe("assembled site", () => {
  it("has been built", () => {
    expect(existsSync(dist), "run `pnpm build` first").toBe(true);
  });

  it.each(["index.html", "verso/index.html", "fort/index.html"])(
    "serves %s",
    (page) => {
      expect(existsSync(join(dist, page))).toBe(true);
    },
  );

  it("leaves no Docker artefacts in the repo", () => {
    const root = readdirSync(process.cwd());
    expect(root).not.toContain("docker-compose.local.yml");
    expect(root).not.toContain("proxy");
  });
});
