"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "motion/react";
import { Menu, Close } from "./icons";

/**
 * The portfolio's pill nav, with this site's links. Every anchor here is a
 * plain <a> — see app/page.test.ts. The in-page ones are hash links that
 * SmoothScroll intercepts; the rest leave the site.
 */
const links = [
  { href: "#playground", label: "playground" },
  { href: "#services", label: "services" },
];

const outbound = [
  { href: "https://github.com/Justdan111", label: "github" },
  { href: "https://x.com/dan_code", label: "x" },
];

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="sticky top-0 z-40"
    >
      <div
        className={clsx(
          "mx-auto max-w-6xl px-4 sm:px-6 transition-all duration-300",
          scrolled ? "pt-3" : "pt-6",
        )}
      >
        <div
          className={clsx(
            "flex items-center justify-between rounded-full border border-border bg-background/80 backdrop-blur-md px-5 py-2.5 transition-shadow",
            scrolled && "shadow-sm",
          )}
        >
          <a href="/" className="flex flex-col leading-tight">
            <span className="text-[15px] font-semibold tracking-tight text-muted-foreground">
              dan
            </span>
            <span className="text-[15px] font-semibold tracking-tight">
              experiments
            </span>
          </a>

          <nav className="hidden md:flex items-center gap-1">
            {[...links, ...outbound].map((l) => (
              <a
                key={l.href}
                href={l.href}
                {...(l.href.startsWith("http")
                  ? { target: "_blank", rel: "noreferrer" }
                  : {})}
                className="rounded-full px-3.5 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {l.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <a
              href="https://dan-code.dev"
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex items-center rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              the portfolio
            </a>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              className="md:hidden inline-flex items-center justify-center rounded-full border border-border p-2"
            >
              {open ? <Close /> : <Menu />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="md:hidden fixed inset-x-0 top-24 z-30 mx-4 rounded-2xl border border-border bg-background p-2 shadow-lg"
          >
            <ul className="flex flex-col">
              {[...links, ...outbound].map((l) => (
                <li key={l.href}>
                  <a
                    href={l.href}
                    {...(l.href.startsWith("http")
                      ? { target: "_blank", rel: "noreferrer" }
                      : {})}
                    onClick={() => setOpen(false)}
                    className="block rounded-xl px-4 py-3 text-base hover:bg-muted"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
              <li className="mt-2 border-t border-border pt-2">
                <a
                  href="https://dan-code.dev"
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setOpen(false)}
                  className="block rounded-xl bg-foreground px-4 py-3 text-center text-base font-medium text-background"
                >
                  the portfolio →
                </a>
              </li>
            </ul>
          </motion.nav>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
