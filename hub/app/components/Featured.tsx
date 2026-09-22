import { experiments } from "../../content/experiments";
import { FeaturedRail } from "./FeaturedRail";
import { FeaturedSwipe } from "./FeaturedSwipe";
import { MediaPlate } from "./MediaPlate";
import { Reveal, RevealItem, RevealStagger } from "./Reveal";
import { SectionLabel } from "./SectionLabel";
import { ArrowUpRight } from "./icons";

/**
 * Three by slug rather than by index, so reordering the data can't reshuffle
 * what the top of the page leads with.
 *
 * Every one of them must have a clip: this rail is the first thing on the page
 * and it plays its cards large, so a placeholder here reads as an unfinished
 * site rather than as an experiment awaiting a recording.
 * `content/featured.test.ts` holds that line.
 */
const FEATURED = ["moodlift", "sushi", "halftone"];

const featured = FEATURED.map((slug) => {
  const experiment = experiments.find((e) => e.slug === slug);
  if (!experiment) throw new Error(`Featured slug not in experiments: ${slug}`);
  return experiment;
});

export function Featured() {
  return (
    <section className="pb-8 sm:pb-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal>
          <SectionLabel>Recent</SectionLabel>
        </Reveal>
      </div>

      {/* Two rails, one idea. The pinned one needs room to travel and a
          pointer to drag it; the narrow one is moved with a thumb. */}
      <div data-rail className="mt-8 hidden lg:block">
        <FeaturedRail experiments={featured} />
      </div>

      <div data-swipe className="mt-8 lg:hidden">
        <FeaturedSwipe experiments={featured} />
      </div>

      {/* Shown only when reduced motion has taken the pinned rail away. The
          attribute goes on a plain element: RevealStagger takes only children,
          className and gap, so anything else is silently dropped. */}
      <div data-rail-fallback hidden>
        <RevealStagger className="mx-auto mt-8 grid max-w-6xl gap-10 px-4 sm:grid-cols-2 sm:px-6">
          {featured.map((experiment) => (
            <RevealItem key={experiment.slug}>
            {/* Plain anchor, never next/link — see app/page.test.ts. */}
            <a href={`/notes/${experiment.slug}/`} className="group block">
              <div className="relative aspect-16/10 overflow-hidden rounded-3xl border border-border transition-colors group-hover:border-accent/40">
                <MediaPlate experiment={experiment} />
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <h3 className="text-lg font-semibold tracking-tight transition-colors group-hover:text-accent">
                  {experiment.title}
                </h3>
                <ArrowUpRight
                  width={14}
                  height={14}
                  className="text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                />
              </div>
              <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
                {experiment.blurb}
              </p>
            </a>
            </RevealItem>
          ))}
        </RevealStagger>
      </div>
    </section>
  );
}
