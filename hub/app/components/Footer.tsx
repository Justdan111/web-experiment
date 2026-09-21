import { experiments } from "../../content/experiments";
import { GitHub, X } from "./icons";

const year = new Date().getFullYear();

export function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-14 sm:py-16">
        <div className="flex flex-col gap-10 md:flex-row md:justify-between">
          <div className="max-w-sm">
            <p className="text-[15px] font-semibold tracking-tight">
              dan / experiments
            </p>
            <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
              {experiments.length} experiments in mobile and web. An annex of{" "}
              <a
                href="https://dan-code.dev"
                target="_blank"
                rel="noreferrer"
                className="text-accent underline underline-offset-4"
              >
                dan-code.dev
              </a>
              .
            </p>
          </div>

          <nav aria-label="Elsewhere" className="flex flex-col gap-3">
            <span className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Elsewhere
            </span>
            <a
              href="https://github.com/Justdan111"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <GitHub width={16} height={16} /> github
            </a>
            <a
              href="https://x.com/dan_code"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <X width={16} height={16} /> x
            </a>
          </nav>
        </div>

        <p className="mt-12 font-mono text-xs text-muted-foreground">
          © {year} Emmanuel Ngulube
        </p>
      </div>
    </footer>
  );
}
