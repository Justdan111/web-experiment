import { describe, expect, it } from "vitest";
import { experiments } from "./experiments";
import { applyFilter, filterKey } from "./filter";

describe("applyFilter", () => {
  it("returns everything for all", () => {
    expect(applyFilter(experiments, { kind: "all" })).toHaveLength(13);
  });

  it("narrows to a platform", () => {
    const got = applyFilter(experiments, { kind: "platform", value: "web" });
    expect(got).toHaveLength(2);
    expect(got.every((e) => e.platform === "web")).toBe(true);
  });

  it("narrows to a category", () => {
    const got = applyFilter(experiments, { kind: "category", value: "Gestures" });
    expect(got.every((e) => e.category === "Gestures")).toBe(true);
    expect(got.length).toBeGreaterThan(0);
  });

  it("preserves the source order", () => {
    const got = applyFilter(experiments, { kind: "platform", value: "mobile" });
    const expected = experiments.filter((e) => e.platform === "mobile");
    expect(got.map((e) => e.slug)).toEqual(expected.map((e) => e.slug));
  });

  it("never returns the same key for two different filters", () => {
    const keys = [
      filterKey({ kind: "all" }),
      filterKey({ kind: "platform", value: "mobile" }),
      filterKey({ kind: "platform", value: "web" }),
      filterKey({ kind: "category", value: "Motion" }),
    ];
    expect(new Set(keys).size).toBe(keys.length);
  });
});
