import Link from "next/link";
import { NAV } from "../content/site";
import ThemeToggle from "./ThemeToggle";

export default function Nav() {
  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <nav
        className="mx-auto flex h-14 max-w-(--content) items-center justify-between px-(--gutter)"
        style={{ letterSpacing: "var(--track-16)" }}
      >
        {/* The mark. A verso is the reverse side of a leaf, hence the flip. */}
        <Link href="/" aria-label="Verso, home" className="text-[18px] font-bold">
          <span style={{ color: "var(--mark)" }}>V</span>
        </Link>

        <ul className="hidden gap-8 text-[16px] md:flex">
          {NAV.map((item) => (
            <li key={item.href}>
              <span
                className="cursor-default transition-colors"
                style={{ color: "var(--muted)" }}
              >
                {item.label}
              </span>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-4 text-[16px]">
          {/* Static indicator: EN is the only locale in scope. */}
          <span style={{ color: "var(--muted)" }} aria-label="Language: English">
            <span className="opacity-50">中</span>
            <span className="opacity-50"> / </span>
            <span style={{ color: "var(--text)" }}>EN</span>
          </span>
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}
