import { describe, expect, it } from "vitest";
import nextConfig from "../../next.config";
import { BASE_PATH, asset } from "./base-path";

describe("BASE_PATH", () => {
  it("is the folder name this experiment is served under", () => {
    expect(BASE_PATH).toBe("/fort");
  });

  it("is what next.config.ts configures, so the two cannot drift", () => {
    expect(nextConfig.basePath).toBe(BASE_PATH);
  });
});

describe("asset", () => {
  it("prefixes a public path so it resolves under the base path", () => {
    expect(asset("/media/ball.png")).toBe("/fort/media/ball.png");
  });

  it("is idempotent, so double-wrapping during a refactor is harmless", () => {
    expect(asset(asset("/media/ball.png"))).toBe("/fort/media/ball.png");
  });
});
