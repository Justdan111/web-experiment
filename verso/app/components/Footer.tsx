import Clock from "./Clock";
import { CLOCKS, FOOTER_COLUMNS, LEGAL, SOCIALS } from "../content/site";

export default function Footer() {
  return (
    <footer className="mx-auto max-w-(--content) px-(--gutter) pb-16 pt-24">
      <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
        {FOOTER_COLUMNS.map((column, i) => (
          <ul
            key={i}
            className="text-[24px] uppercase md:text-[28px] lg:text-[32px] lg:leading-10"
            style={{ letterSpacing: "var(--track-32)" }}
          >
            {column.map((item, j) => (
              <li
                key={item.href}
                // The first item of the first column is the current page.
                className={
                  i === 0 && j === 0
                    ? "cursor-default text-(--text)"
                    : "cursor-default text-(--muted) transition-colors hover:text-(--text)"
                }
              >
                {item.label}
              </li>
            ))}
          </ul>
        ))}

        {CLOCKS.map((zone) => (
          <Clock key={zone.city} zone={zone} />
        ))}
      </div>

      <div className="mt-20 flex flex-wrap items-center justify-between gap-6">
        {/* Deliberately a div, not a form: there is no submit endpoint in
            this phase, and a form that posts nowhere reloads the page. */}
        <div
          className="flex items-center rounded-full px-2 py-1"
          style={{ background: "var(--hairline)" }}
        >
          <label htmlFor="subscribe" className="sr-only">
            Email
          </label>
          <input
            id="subscribe"
            type="email"
            placeholder="Email"
            className="w-56 bg-transparent px-4 py-3 text-[16px] outline-none"
            style={{ letterSpacing: "var(--track-16)" }}
          />
          <span
            aria-disabled="true"
            className="cursor-default rounded-full px-6 py-3 text-[16px]"
            style={{ background: "var(--hairline)", letterSpacing: "var(--track-16)" }}
          >
            Subscribe
          </span>
        </div>

        <ul className="flex gap-5 text-[12px]" style={{ color: "var(--muted)", letterSpacing: "var(--track-12)" }}>
          {SOCIALS.map((s) => (
            <li key={s.label}>
              <a href={s.href} className="transition-colors hover:text-(--text)">
                {s.label}
              </a>
            </li>
          ))}
        </ul>
      </div>

      <div
        className="mt-24 flex flex-wrap justify-between gap-8 text-[12px]"
        style={{ color: "var(--muted)", letterSpacing: "var(--track-12)" }}
      >
        <div>
          <div style={{ color: "var(--text)" }}>{LEGAL.copyright}</div>
          <div>{LEGAL.rights}</div>
        </div>
        <p className="max-w-[44ch] leading-[1.6]">{LEGAL.notice}</p>
        <div>{LEGAL.signoff}</div>
      </div>
    </footer>
  );
}
