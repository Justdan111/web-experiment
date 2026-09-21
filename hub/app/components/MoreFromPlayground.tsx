import {
  numberOf,
  relatedTo,
  type Experiment,
} from "../../content/experiments";
import { ExperimentCard } from "./ExperimentCard";

/**
 * Three others, same category first. They keep their permanent numbers rather
 * than being renumbered 01–03 — this is a selection, not a filtered view of
 * the grid, so the number still identifies the experiment.
 */
export function MoreFromPlayground({ experiment }: { experiment: Experiment }) {
  const related = relatedTo(experiment, 3);

  return (
    <section className="mx-auto max-w-6xl px-4 sm:px-6 pb-24 sm:pb-32">
      <div className="flex flex-wrap items-baseline justify-between gap-4 border-t border-border pt-12">
        <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">
          more from the playground
        </h2>
        <a
          href="/#playground"
          className="group inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          all experiments
          <span
            aria-hidden
            className="transition-transform group-hover:translate-x-0.5"
          >
            →
          </span>
        </a>
      </div>

      <ul className="mt-10 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
        {related.map((item) => (
          <ExperimentCard
            key={item.slug}
            experiment={item}
            index={numberOf(item)}
          />
        ))}
      </ul>
    </section>
  );
}
