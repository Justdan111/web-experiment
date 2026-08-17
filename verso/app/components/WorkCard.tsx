import Image from "next/image";
import type { Work } from "../content/types";

export default function WorkCard({ work }: { work: Work }) {
  return (
    <article className={work.wide ? "group is-wide" : "group"}>
      <div className="h-(--card-h) overflow-hidden" style={{ background: "var(--hairline)" }}>
        <Image
          src={work.image}
          alt={`${work.title} — ${work.subtitle}`}
          width={work.wide ? 1400 : 700}
          height={880}
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
          sizes={work.wide ? "(max-width: 767px) 100vw, 684px" : "(max-width: 767px) 100vw, 338px"}
        />
      </div>

      <div className="mt-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-[16px]" style={{ letterSpacing: "var(--track-16)" }}>
            {work.title}
          </h3>
          <p className="mt-1 text-[16px]" style={{ color: "var(--muted)", letterSpacing: "var(--track-16)" }}>
            {work.subtitle}
          </p>
        </div>

        <ul className="flex shrink-0 gap-1" aria-label="Disciplines">
          {work.badges.map((b) => (
            <li
              key={b}
              className="grid h-6 w-6 place-items-center rounded-full text-[12px]"
              style={{ background: "var(--hairline)", color: "var(--muted)", letterSpacing: "var(--track-12)" }}
            >
              {b}
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}
