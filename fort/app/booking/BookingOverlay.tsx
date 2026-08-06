"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { subscribeBooking } from "./bus";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function BookingOverlay() {
  const [open, setOpen] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const restoreTo = useRef<HTMLElement | null>(null);
  const scrollY = useRef(0);

  const close = useCallback(() => setOpen(false), []);

  useEffect(
    () =>
      subscribeBooking((trigger) => {
        restoreTo.current =
          trigger ?? (document.activeElement as HTMLElement | null);
        setOpen(true);
      }),
    [],
  );

  /* take the page behind the overlay out of the tab order and off the a11y tree */
  useEffect(() => {
    if (!open) return;
    const landing = document.getElementById("landing-root");
    if (!landing) return;

    landing.inert = true;
    return () => {
      landing.inert = false;
    };
  }, [open]);

  /* lock the page behind the overlay, and put it back exactly as it was */
  useEffect(() => {
    if (!open) return;

    scrollY.current = window.scrollY;
    const { body } = document;
    const prev = {
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
      overflow: body.style.overflow,
    };

    body.style.position = "fixed";
    body.style.top = `-${scrollY.current}px`;
    body.style.width = "100%";
    body.style.overflow = "hidden";

    return () => {
      body.style.position = prev.position;
      body.style.top = prev.top;
      body.style.width = prev.width;
      body.style.overflow = prev.overflow;
      window.scrollTo(0, scrollY.current);
      // the lock changed document height, so every pin's cached start/end is stale
      ScrollTrigger.refresh();
      // WebKit leaves activeElement at document.body after a button click;
      // focusing body is a no-op there but guard it explicitly regardless.
      if (restoreTo.current && restoreTo.current !== document.body) {
        restoreTo.current.focus?.();
      }
    };
  }, [open]);

  /* escape to close, and keep focus inside while it is up */
  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
        return;
      }
      if (e.key !== "Tab" || !panel.current) return;

      const items = Array.from(
        panel.current.querySelectorAll<HTMLElement>(FOCUSABLE),
      ).filter((el) => el.offsetParent !== null);
      if (!items.length) return;

      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;

      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  /* move focus into the panel once it exists */
  useEffect(() => {
    if (!open) return;
    panel.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus();
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="bk"
      role="dialog"
      aria-modal="true"
      aria-label="Reserve a court"
    >
      <div className="bk-panel" ref={panel}>
        <header className="bk-bar">
          <span className="bk-step-count">RESERVE A COURT</span>
          <button
            type="button"
            className="bk-close"
            onClick={close}
            aria-label="Close"
          >
            <span />
            <span />
          </button>
        </header>
        <div className="bk-body" />
      </div>
    </div>
  );
}
