"use client";

import { useEffect, useState } from "react";
import { runFor, type Experiment } from "../../content/experiments";
import { SectionLabel } from "./SectionLabel";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const id = window.setTimeout(() => setCopied(false), 1600);
    return () => window.clearTimeout(id);
  }, [copied]);

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          // Absent outside a secure context, which includes plain-http previews.
          await navigator.clipboard.writeText(text);
          setCopied(true);
        } catch {
          setCopied(false);
        }
      }}
      className="rounded-md bg-white/10 px-2.5 py-1 font-mono text-[11px] text-white/70 transition-colors hover:bg-white/20 hover:text-white"
    >
      {copied ? "copied" : "copy"}
    </button>
  );
}

export function RunBlock({ experiment }: { experiment: Experiment }) {
  const { label, lines, note } = runFor(experiment);
  const mobile = experiment.platform === "mobile";

  // A path is a page of this site; anything else is somewhere to be sent.
  const here = experiment.live?.startsWith("/") ?? false;
  const liveLabel = experiment.live
    ? here
      ? experiment.live
      : `${new URL(experiment.live).hostname} ↗`
    : "github ↗";

  return (
    <section className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-20">
      <div className="grid gap-10 lg:grid-cols-[1fr_17rem] lg:gap-16">
        <div className="min-w-0">
          <SectionLabel>Run it yourself</SectionLabel>

          <h2 className="mt-4 text-3xl sm:text-4xl font-semibold tracking-tight">
            {mobile
              ? "a clip doesn't do it justice. run it on your phone."
              : "read the source, or run it locally."}
          </h2>

          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
            {mobile
              ? "It's a standalone Expo app. Four commands and it's on your screen, gestures and haptics and all."
              : "It's a standalone Next app with no server behind it. Four commands and it's running."}
          </p>

          <div className="mt-8 overflow-hidden rounded-2xl bg-foreground">
            <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
              <span aria-hidden className="flex gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
                <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
                <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
              </span>
              <span className="font-mono text-[11px] text-white/40">{label}</span>
              <span className="ml-auto">
                <CopyButton text={lines.join("\n")} />
              </span>
            </div>

            <pre className="overflow-x-auto px-4 py-5 font-mono text-[13px] leading-7 text-white/90">
              <code>
                {lines.map((line) => (
                  <span key={line} className="block">
                    <span aria-hidden className="select-none text-white/30">
                      ${" "}
                    </span>
                    {line}
                  </span>
                ))}
              </code>
            </pre>
          </div>

          <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
            {note}
          </p>
        </div>

        <dl className="lg:pt-10">
          {[
            { label: "Platform", value: experiment.platform },
            { label: "Category", value: experiment.category },
            { label: "Year", value: String(experiment.year) },
          ].map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between gap-6 border-t border-border py-3.5"
            >
              <dt className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
                {row.label}
              </dt>
              <dd className="text-[15px] font-medium">{row.value}</dd>
            </div>
          ))}

          <div className="flex items-center justify-between gap-6 border-t border-b border-border py-3.5">
            <dt className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
              {experiment.live ? "Live" : "Source"}
            </dt>
            <dd className="min-w-0 text-[15px] font-medium">
              {/* Plain anchor, never next/link — see app/page.test.ts. */}
              <a
                href={experiment.live ?? experiment.repo}
                {...(here
                  ? {}
                  : { target: "_blank", rel: "noreferrer" })}
                className="block truncate underline decoration-border underline-offset-4 transition-colors hover:text-accent hover:decoration-accent"
              >
                {liveLabel}
              </a>
            </dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
