import type { Category, Experiment, Platform } from "./experiments";

/**
 * The rail carries two axes in one list — platform above the hairline, craft
 * below — so a filter is one or the other, never both at once.
 */
export type Filter =
  | { kind: "all" }
  | { kind: "platform"; value: Platform }
  | { kind: "category"; value: Category };

export function applyFilter(list: Experiment[], filter: Filter): Experiment[] {
  switch (filter.kind) {
    case "all":
      return list;
    case "platform":
      return list.filter((e) => e.platform === filter.value);
    case "category":
      return list.filter((e) => e.category === filter.value);
  }
}

/** Stable identity for a filter — used for React keys and for comparison. */
export function filterKey(filter: Filter): string {
  return filter.kind === "all" ? "all" : `${filter.kind}:${filter.value}`;
}
