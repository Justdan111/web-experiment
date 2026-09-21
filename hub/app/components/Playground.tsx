"use client";

import { useMemo, useState } from "react";
import { AnimatePresence } from "motion/react";
import { experiments } from "../../content/experiments";
import { applyFilter, type Filter } from "../../content/filter";
import { ExperimentCard } from "./ExperimentCard";
import { FilterRail } from "./FilterRail";
import { SectionLabel } from "./SectionLabel";

export function Playground() {
  const [filter, setFilter] = useState<Filter>({ kind: "all" });
  const shown = useMemo(() => applyFilter(experiments, filter), [filter]);

  return (
    <section
      id="playground"
      className="mx-auto max-w-6xl px-4 sm:px-6 py-20 sm:py-28"
    >
      <SectionLabel>Studio R&amp;D, in the open</SectionLabel>

      <div className="mt-4 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <h2 className="text-4xl sm:text-5xl font-semibold tracking-tight">
          the playground
        </h2>
        <p className="max-w-md text-[15px] leading-relaxed text-muted-foreground">
          Every experiment is a standalone app that isolates one question — how
          should this feel to touch, how should this page move? Filter it, open
          it, clone it.
        </p>
      </div>

      <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,15rem)_1fr]">
        <FilterRail
          selected={filter}
          onSelect={setFilter}
          shown={shown.length}
        />

        <ul className="grid min-w-0 gap-x-6 gap-y-12 sm:grid-cols-2">
          <AnimatePresence mode="popLayout" initial={false}>
            {shown.map((experiment, i) => (
              <ExperimentCard
                key={experiment.slug}
                experiment={experiment}
                index={i + 1}
              />
            ))}
          </AnimatePresence>
        </ul>
      </div>
    </section>
  );
}
