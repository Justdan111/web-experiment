import type { CSSProperties } from "react";
import type { Experiment } from "../../content/experiments";

/**
 * The card links to the case study — a page in this app. The separate "visit
 * live" link goes to the experiment itself, which a different container
 * serves, so both are plain anchors. `app/page.test.ts` keeps `next/link` out
 * of the whole app rather than out of one file, so extracting this component
 * did not quietly disable that check.
 */
export default function ExperimentCard({ experiment }: { experiment: Experiment }) {
  const { slug, title, blurb, tags, year, href, poster, status, caseStudy } = experiment;

  return (
    <li
      className="ix-card"
      style={
        {
          "--card-accent": caseStudy.accent,
          "--card-accent-ink": caseStudy.accentInk,
        } as CSSProperties
      }
    >
      <a href={`/notes/${slug}/`} className="ix-link">
        <div className="ix-plate">
          <img src={poster} alt="" />
        </div>
        <h2 className="ix-name">
          {title}
          {status === "wip" && <span className="ix-wip">In progress</span>}
        </h2>
        <p className="ix-blurb">{blurb}</p>
      </a>

      <div className="ix-foot">
        <span className="label">
          {year} · {tags.join(" · ")}
        </span>
        <a href={href} className="ix-live">
          Visit live ↗
        </a>
      </div>
    </li>
  );
}
