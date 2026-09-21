"use client";

import clsx from "clsx";
import {
  CATEGORIES,
  countsFor,
  experiments,
  type Category,
  type Platform,
} from "../../content/experiments";
import { filterKey, type Filter } from "../../content/filter";

const { platform: platformCounts, category: categoryCounts } =
  countsFor(experiments);

const PLATFORMS: { value: Platform; label: string }[] = [
  { value: "mobile", label: "Mobile" },
  { value: "web", label: "Web" },
];

type Row = { filter: Filter; label: string; count: number };

/**
 * Two axes in one list. Platform first, because that is the split the site is
 * about; craft below a hairline. Counts are derived from the data, so a row
 * can never claim a number the grid does not produce.
 */
const groups: Row[][] = [
  [{ filter: { kind: "all" }, label: "All experiments", count: experiments.length }],
  PLATFORMS.map((p) => ({
    filter: { kind: "platform", value: p.value } as Filter,
    label: p.label,
    count: platformCounts[p.value],
  })),
  CATEGORIES.map((c: Category) => ({
    filter: { kind: "category", value: c } as Filter,
    label: c,
    count: categoryCounts[c],
  })),
];

export function FilterRail({
  selected,
  onSelect,
  shown,
}: {
  selected: Filter;
  onSelect: (filter: Filter) => void;
  shown: number;
}) {
  const selectedKey = filterKey(selected);

  const button = (row: Row) => {
    const active = filterKey(row.filter) === selectedKey;
    return (
      <button
        key={filterKey(row.filter)}
        type="button"
        onClick={() => onSelect(row.filter)}
        aria-pressed={active}
        className={clsx(
          "flex shrink-0 items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm transition-colors lg:w-full lg:justify-between",
          active
            ? "bg-muted font-medium text-foreground"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <span>{row.label}</span>
        <span className="font-mono text-xs tabular-nums text-muted-foreground">
          {row.count}
        </span>
      </button>
    );
  };

  return (
    <div className="min-w-0 lg:sticky lg:top-28 lg:self-start">
      {/* Below lg the rail is one horizontally scrolling row of the same
          buttons — the group structure only reads as structure when stacked. */}
      <div className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-2 lg:mx-0 lg:flex-col lg:overflow-visible lg:rounded-2xl lg:border lg:border-border lg:p-2 lg:pb-2">
        {groups.map((rows, i) => (
          <div
            key={i}
            className={clsx(
              "flex gap-1 lg:flex-col",
              i > 0 && "lg:mt-1 lg:border-t lg:border-border lg:pt-1",
            )}
          >
            {rows.map(button)}
          </div>
        ))}

      </div>

      <p
        aria-live="polite"
        className="px-3.5 pt-2 font-mono text-xs text-muted-foreground lg:border-t lg:border-border lg:pt-3"
      >
        Showing {shown} of {experiments.length}
      </p>
    </div>
  );
}
