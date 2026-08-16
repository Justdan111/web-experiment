"use client";

import { useSyncExternalStore } from "react";

type Theme = "light" | "dark";

/** The <html data-theme> attribute is the single source of truth; watch it. */
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  return () => observer.disconnect();
}

function getSnapshot(): Theme {
  return document.documentElement.getAttribute("data-theme") === "light"
    ? "light"
    : "dark";
}

/** Matches the hardcoded data-theme="dark" the server renders in layout.tsx. */
function getServerSnapshot(): Theme {
  return "dark";
}

export default function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggle = () => {
    const next: Theme = theme === "light" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("theme", next);
    } catch {
      // Private mode or blocked storage: the toggle still works for this session.
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "light" ? "Switch to dark theme" : "Switch to light theme"}
      className="text-[16px] leading-none opacity-60 transition-opacity hover:opacity-100"
      style={{ letterSpacing: "var(--track-16)", color: "var(--muted)" }}
    >
      {theme === "light" ? "☾" : "☀"}
    </button>
  );
}
