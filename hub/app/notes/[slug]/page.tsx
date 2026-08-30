import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { caseStudyBodies } from "../../../content/case-studies";
import { caseStudyParams } from "../../../content/case-studies/params";
import { experiments } from "../../../content/experiments";

export const generateStaticParams = caseStudyParams;

export async function generateMetadata({
  params,
}: PageProps<"/notes/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const experiment = experiments.find((e) => e.slug === slug);
  if (!experiment) return {};

  return {
    title: `${experiment.title} — Case study`,
    description: experiment.caseStudy.summary,
  };
}

export default async function CaseStudyPage({ params }: PageProps<"/notes/[slug]">) {
  const { slug } = await params;

  const index = experiments.findIndex((e) => e.slug === slug);
  const experiment = experiments[index];
  const Body = caseStudyBodies[slug];
  if (!experiment || !Body) notFound();

  const { title, href, poster, caseStudy } = experiment;
  const { summary, stack, accent, accentInk } = caseStudy;
  const next = experiments[(index + 1) % experiments.length];

  return (
    <div
      className="cs"
      style={{ "--cs-accent": accent, "--cs-accent-ink": accentInk } as CSSProperties}
    >
      <header className="cs-bar">
        <div className="cs-bar-inner">
          <a href="/" className="cs-back">
            ← All experiments
          </a>
          {/* A different container serves this — plain anchor, never next/link. */}
          <a href={href} className="cs-bar-live">
            Visit live site ↗
          </a>
        </div>
      </header>

      <main className="shell">
        <article>
          {/* Four children: the load sequence in globals.css staggers them. */}
          <header className="cs-hero">
            <h1 className="cs-title">{title}</h1>
            <div className="cs-rule" />
            <p className="cs-summary">{summary}</p>
            <a href={href} className="cs-cta">
              Visit live site <span aria-hidden="true">→</span>
            </a>
          </header>

          <figure className="cs-plate">
            <img src={poster} alt={`The ${title} homepage`} />
          </figure>

          <ul className="cs-chips" aria-label="Built with">
            {stack.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <div className="cs-prose">
            <Body />
          </div>
        </article>

        <nav className="cs-next" aria-label="More experiments">
          <a href="/" className="cs-next-link">
            <span className="label">Index</span>
            <div className="cs-next-name">All experiments</div>
          </a>
          {next.slug !== slug && (
            <a href={`/notes/${next.slug}/`} className="cs-next-link">
              <span className="label">Next</span>
              <div className="cs-next-name">{next.title} →</div>
            </a>
          )}
        </nav>
      </main>
    </div>
  );
}
