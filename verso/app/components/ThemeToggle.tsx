"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null);

  // Read what the pre-paint boot script decided; never re-derive it.
  // `document` doesn't exist during SSR, so this can only happen post-mount,
  // in an effect — not as a lazy initializer. There is no external-system
  // subscription to attach to instead, so the setState below is unavoidable.
  useEffect(() => {
    const current = document.documentElement.getAttribute("data-theme");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(current === "light" ? "light" : "dark");
  }, []);

  const toggle = () => {
    const next: Theme = theme === "light" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("theme", next);
    } catch {
      // Private mode or blocked storage: the toggle still works for this session.
    }
    setTheme(next);
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
