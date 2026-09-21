"use client";

import { motion } from "motion/react";
import { experiments } from "../../content/experiments";
import { ArrowUpRight } from "./icons";
import { SectionLabel } from "./SectionLabel";

const easing = [0.22, 1, 0.36, 1] as const;

const headingWords = [
  { text: "an" },
  { text: "idea" },
  { text: "isn't" },
  { text: "real" },
  { text: "until" },
  { text: "it" },
  { text: "runs.", accent: true },
];

const container = {
  hidden: {},
  visible: { transition: { delayChildren: 0.1, staggerChildren: 0.06 } },
} as const;

const word = {
  hidden: { opacity: 0, y: "0.4em" },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: easing } },
} as const;

/** The heading's stagger has finished by here; everything else waits for it. */
const headingDone = 0.1 + headingWords.length * 0.06 + 0.5;

const latest = experiments[0];

const rail = [
  { label: "Status", value: "open for projects", dot: true },
  { label: "Experiments", value: String(experiments.length) },
  { label: "Latest drop", value: latest.title, href: `/notes/${latest.slug}/` },
  { label: "Currently into", value: "live activities" },
];

export function Hero() {
  return (
    <section className="mx-auto max-w-6xl px-4 sm:px-6 pt-16 pb-12 sm:pt-24 sm:pb-20">
      <div className="grid gap-14 lg:grid-cols-[1.35fr_1fr] lg:items-end lg:gap-20">
        <div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            <SectionLabel>Mobile and web · {experiments.length} builds</SectionLabel>
          </motion.div>

          <motion.h1
            initial="hidden"
            animate="visible"
            variants={container}
            className="mt-5 flex flex-wrap gap-x-[0.3em] gap-y-1 text-5xl sm:text-6xl md:text-7xl font-semibold leading-[1.02] tracking-tight"
          >
            {headingWords.map((w) => (
              <motion.span
                key={w.text}
                variants={word}
                className={w.accent ? "inline-block text-accent" : "inline-block"}
              >
                {w.text}
              </motion.span>
            ))}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: easing, delay: headingDone }}
            className="mt-7 max-w-xl text-base sm:text-lg leading-relaxed text-muted-foreground"
          >
            dan / experiments is where I take one question — how should this
            gesture feel, how should this page move — and build the smallest
            thing that answers it. Eleven React Native apps, two sites. Each one
            standalone, each one open.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: easing, delay: headingDone + 0.1 }}
            className="mt-9 flex flex-wrap gap-3"
          >
            <a
              href="#playground"
              className="inline-flex items-center rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              the playground
            </a>
            <a
              href="https://github.com/Justdan111"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-5 py-2.5 text-sm font-medium transition-colors hover:bg-card"
            >
              github <ArrowUpRight width={14} height={14} />
            </a>
          </motion.div>
        </div>

        <motion.dl
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: easing, delay: headingDone + 0.18 }}
          className="lg:pb-2"
        >
          {rail.map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between gap-6 border-t border-border py-4 last:border-b"
            >
              <dt className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
                {row.label}
              </dt>
              <dd className="flex items-center gap-2 text-right text-[15px] font-medium">
                {row.dot && (
                  <span
                    aria-hidden
                    className="h-1.5 w-1.5 rounded-full bg-green-500"
                  />
                )}
                {row.href ? (
                  // Plain anchor, never next/link — see app/page.test.ts.
                  <a
                    href={row.href}
                    className="underline decoration-border underline-offset-4 transition-colors hover:text-accent hover:decoration-accent"
                  >
                    {row.value}
                  </a>
                ) : (
                  row.value
                )}
              </dd>
            </div>
          ))}
        </motion.dl>
      </div>
    </section>
  );
}
