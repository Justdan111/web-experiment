"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { subscribeBooking } from "./bus";
import {
  bookingReducer,
  firstIncompleteStep,
  initialBooking,
} from "./useBooking";
import CourtStep from "./steps/CourtStep";
import DateStep from "./steps/DateStep";
import TimeStep from "./steps/TimeStep";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Selection lands, the highlight registers, then the flow moves on. */
const ADVANCE_MS = 250;

export default function BookingOverlay() {
  const [open, setOpen] = useState(false);
  const [state, dispatch] = useReducer(bookingReducer, initialBooking);
  const [now, setNow] = useState<Date | null>(null);
  const panel = useRef<HTMLDivElement>(null);
  const restoreTo = useRef<HTMLElement | null>(null);
  const scrollY = useRef(0);
  const timer = useRef<number | null>(null);

  /** Overlay never unmounts on close — it just stops rendering — so a
   * pending `advance` timeout would otherwise survive close and reopen and
   * fire a stale dispatch into a freshly reset state. */
  const close = useCallback(() => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = null;
    setOpen(false);
  }, []);

  /** Delay the dispatch so the tile's selected state is visible before moving. */
  const advance = useCallback((fn: () => void) => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(fn, ADVANCE_MS);
  }, []);

  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current);
    },
    [],
  );

  useEffect(
    () =>
      subscribeBooking((trigger) => {
        // guard against a timer left pending by any other route into open
        // (not just `close`), so it can never survive into a new session
        if (timer.current) window.clearTimeout(timer.current);
        timer.current = null;
        restoreTo.current =
          trigger ?? (document.activeElement as HTMLElement | null);
        // read the clock at open time — never at module scope, which would
        // bake a stale "now" into the bundle
        setNow(new Date());
        dispatch({ type: "RESET" });
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

  /* move focus into the panel once it exists, and again on every step change */
  useEffect(() => {
    if (!open) return;
    panel.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus();
  }, [open, state.step]);

  if (!open || !now) return null;

  // only reachable through a state bug, but it fails visibly instead of
  // rendering a step with half its inputs missing
  const step = Math.min(state.step, firstIncompleteStep(state));

  return (
    <div
      className="bk"
      role="dialog"
      aria-modal="true"
      aria-label="Reserve a court"
    >
      <div className="bk-panel" ref={panel}>
        <header className="bk-bar">
          {step > 0 ? (
            <button
              type="button"
              className="bk-back"
              onClick={() => dispatch({ type: "BACK" })}
            >
              ← BACK
            </button>
          ) : (
            <span className="bk-step-count">RESERVE A COURT</span>
          )}
          <span className="bk-step-count">
            {String(step + 1).padStart(2, "0")} / 04
          </span>
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

        <div className="bk-rail" aria-hidden="true">
          <span style={{ width: `${((step + 1) / 4) * 100}%` }} />
        </div>

        <div className="bk-body">
          {step === 0 && (
            <CourtStep
              value={state.courtId}
              onSelect={(courtId) =>
                advance(() => dispatch({ type: "SELECT_COURT", courtId }))
              }
            />
          )}
          {step === 1 && state.courtId !== null && (
            <DateStep
              courtId={state.courtId}
              now={now}
              value={state.date}
              onSelect={(date) =>
                advance(() => dispatch({ type: "SELECT_DATE", date }))
              }
            />
          )}
          {step === 2 && state.courtId !== null && state.date !== null && (
            <TimeStep
              courtId={state.courtId}
              date={state.date}
              now={now}
              value={state.hour}
              onSelect={(hour) => advance(() => dispatch({ type: "SELECT_HOUR", hour }))}
            />
          )}
        </div>
      </div>
    </div>
  );
}
