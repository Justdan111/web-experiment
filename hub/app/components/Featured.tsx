import { experiments } from "../../content/experiments";
import { MediaPlate } from "./MediaPlate";
import { Reveal, RevealItem, RevealStagger } from "./Reveal";
import { SectionLabel } from "./SectionLabel";
import { ArrowUpRight } from "./icons";

/** Three by slug rather than by index, so reordering the data can't reshuffle
 *  what the top of the page leads with. */
const FEATURED = ["moodlift", "widget", "verso"];

const featured = FEATURED.map((slug) => {
  const experiment = experiments.find((e) => e.slug === slug);
  if (!experiment) throw new Error(`Featured slug not in experiments: ${slug}`);
  return experiment;
});

export function Featured() {
  return (
    <section className="mx-auto max-w-6xl px-4 sm:px-6 pb-8 sm:pb-16">
      <Reveal>
        <SectionLabel>Recent</SectionLabel>
      </Reveal>

      <RevealStagger className="mt-8 grid gap-10 md:grid-cols-3">
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
    </section>
  );
}
