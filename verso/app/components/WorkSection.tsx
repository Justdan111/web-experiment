import type { Work } from "../content/types";
import WorkCard from "./WorkCard";
import Reveal from "./Reveal";

type Props = {
  label: string;
  /** A CSS custom property name, e.g. "--accent-field". */
  accent: string;
  statement: string;
  works: Work[];
};

export default function WorkSection({ label, accent, statement, works }: Props) {
  return (
    <section className="mx-auto max-w-(--content) px-(--gutter) py-24 md:py-32">
      <Reveal>
        <h2
          className="m-0 text-[12px] font-medium"
          style={{ color: `var(${accent})`, letterSpacing: "var(--track-12)" }}
        >
          {label}
        </h2>
        <p
          className="mt-6 max-w-[46ch] text-[24px] leading-[1.35] md:text-[32px] md:leading-10"
          style={{ letterSpacing: "var(--track-32)" }}
        >
          {statement}
        </p>
      </Reveal>

      <div
        className="mt-16 flex items-center justify-between text-[16px]"
        style={{ letterSpacing: "var(--track-16)" }}
      >
        <span>Works</span>
        <span style={{ color: "var(--muted)" }}>View All</span>
      </div>

      <Reveal stagger className="work-grid mt-6">
        {works.map((w) => (
          <WorkCard key={w.slug} work={w} />
        ))}
      </Reveal>
    </section>
  );
}
