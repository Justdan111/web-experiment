"use client";

import { motion } from "motion/react";
import type { Experiment } from "../../content/experiments";
import { MediaPlate } from "./MediaPlate";

const easing = [0.22, 1, 0.36, 1] as const;

const STATUS_LABEL: Record<Experiment["status"], string> = {
  live: "Live demo",
  source: "Source",
  wip: "In progress",
};

/**
 * The whole card is one anchor, to the detail page. The live site and the
 * GitHub link live on that page, so the card has exactly one target and a tap
 * anywhere on it does the same thing.
 */
export function ExperimentCard({
  experiment,
  index,
}: {
  experiment: Experiment;
  index: number;
}) {
  const { slug, title, blurb, platform, category, tags, status } = experiment;

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.45, ease: easing }}
    >
      {/* Plain anchor, never next/link — see app/page.test.ts. */}
      <a href={`/notes/${slug}/`} className="group block h-full">
        <div className="flex items-baseline gap-3">
          <span className="font-mono text-xs tabular-nums text-muted-foreground">
            {String(index).padStart(2, "0")}
          </span>
          <h3 className="text-lg font-semibold tracking-tight transition-colors group-hover:text-accent">
            {title}
          </h3>
          <span className="ml-auto shrink-0 rounded-full border border-border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
            {STATUS_LABEL[status]}
          </span>
        </div>

        <p className="mt-1 font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">
          {platform} · {category}
        </p>

        <div className="relative mt-4 aspect-4/3 overflow-hidden rounded-2xl border border-border transition-transform duration-500 group-hover:scale-[1.01]">
          <MediaPlate experiment={experiment} />
        </div>

        <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
          {blurb}
        </p>

        <ul className="mt-4 flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <li
              key={tag}
              className="rounded-full bg-muted px-2.5 py-1 font-mono text-[11px] text-muted-foreground"
            >
              {tag}
            </li>
          ))}
        </ul>
      </a>
    </motion.li>
  );
}
