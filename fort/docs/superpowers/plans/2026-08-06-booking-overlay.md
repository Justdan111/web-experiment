# Court Booking Overlay Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the FORT landing page's dead CTA anchors with a full-screen booking overlay running court → date → time → details → confirmation.

**Architecture:** The overlay renders as a *sibling* of `<Landing />`, never a parent or replacement, and is opened through a module-level pub/sub (`bus.ts`) rather than lifted React state. A pure, seeded `availability.ts` decides which slots read as booked. Nothing persists — this is a demo flow.

**Tech Stack:** Next.js 16.3 (App Router, Turbopack), React 19.2, TypeScript, GSAP 3.15 + ScrollTrigger, hand-written CSS, vitest (added by Task 1), pnpm.

## Global Constraints

- **Never unmount or remount `Landing`.** All six GSAP scenes live in one `gsap.context()` whose cleanup runs `ctx.revert()`. Remounting destroys every pinned ScrollTrigger permanently. The overlay is a sibling in `page.tsx`.
- **`page.tsx` stays a server component.** Do not add `"use client"` to it.
- **Call `ScrollTrigger.refresh()` after closing the overlay.** Scroll-lock changes document height and invalidates every pin's cached start/end.
- **Styling is hand-written semantic CSS, not Tailwind utilities.** Follow `app/globals.css` conventions. New rules go in `app/booking/booking.css`.
- **Design tokens already exist globally** in `:root` — `--navy: #021024`, `--lime: #ccff00`, `--blue: #0f3460`, `--grey: #9ba1a5`, `--pad: 20px`. Fonts: `--font-jakob` (headings/buttons), `--font-inter` (body), `--font-satoshi` (small labels).
- **Exactly 8 courts.** The stats section claims "8 WORLD CLASS COURTS".
- **Keep scale and position on separate GSAP tweens.** One tween forces properties to share an ease — that is how the ball-scene easing was lost in the original port.
- **Never use `Date.prototype.toISOString()` for calendar dates.** It converts to UTC and shifts the day. Format from local getters.
- **All new code is TypeScript with explicit types on exported functions.**

---

### Task 1: Seeded availability module

**Files:**
- Create: `app/booking/availability.ts`
- Create: `app/booking/availability.test.ts`
- Create: `vitest.config.ts`
- Modify: `package.json` (add `test` script + vitest devDependency)

**Interfaces:**
- Consumes: nothing.
- Produces: `Court`, `Surface`, `SlotState` types; `COURTS: Court[]`; `SLOT_HOURS: number[]`; `slotState(courtId: number, dateISO: string, hour: number, now: Date): SlotState`; `bookingDates(now: Date, days?: number): string[]`; `formatHour(hour: number): string`; `formatDateLabel(dateISO: string): { weekday: string; day: string; month: string }`; `openSlotCount(courtId: number, dateISO: string, now: Date): number`.

- [ ] **Step 1: Install vitest**

```bash
cd "/Users/danemmanuel/Documents/web experiments/fort"
pnpm add -D vitest@^3
```

- [ ] **Step 2: Add the test script**

In `package.json`, add to `"scripts"`:

```json
"test": "vitest run"
```

- [ ] **Step 3: Create the vitest config**

Create `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["app/**/*.test.ts"],
  },
});
```

- [ ] **Step 4: Write the failing test**

Create `app/booking/availability.test.ts`. Note the explicit `vitest` imports — the project does not enable vitest globals, and adding them would mean editing `tsconfig.json`.

```ts
import { describe, expect, it } from "vitest";
import {
  COURTS,
  SLOT_HOURS,
  bookingDates,
  formatDateLabel,
  formatHour,
  openSlotCount,
  slotState,
} from "./availability";

const NOW = new Date(2026, 7, 6, 9, 30); // 2026-08-06 09:30 local

describe("COURTS", () => {
  it("has the eight courts the stats section promises", () => {
    expect(COURTS).toHaveLength(8);
  });

  it("gives every court a unique id", () => {
    expect(new Set(COURTS.map((c) => c.id)).size).toBe(8);
  });
});

describe("SLOT_HOURS", () => {
  it("closes through the afternoon heat", () => {
    expect(SLOT_HOURS).not.toContain(14);
    expect(SLOT_HOURS).not.toContain(15);
  });

  it("runs from early morning to late evening", () => {
    expect(SLOT_HOURS[0]).toBe(6);
    expect(SLOT_HOURS[SLOT_HOURS.length - 1]).toBe(21);
  });
});

describe("slotState", () => {
  it("is deterministic for the same court, date and hour", () => {
    const a = slotState(3, "2026-08-08", 18, NOW);
    const b = slotState(3, "2026-08-08", 18, NOW);
    expect(a).toBe(b);
  });

  it("stays stable across a thousand repeat calls", () => {
    const first = slotState(5, "2026-08-11", 9, NOW);
    for (let i = 0; i < 1000; i++) {
      expect(slotState(5, "2026-08-11", 9, NOW)).toBe(first);
    }
  });

  it("does not return the same pattern for every court", () => {
    const perCourt = COURTS.map((c) =>
      SLOT_HOURS.map((h) => slotState(c.id, "2026-08-09", h, NOW)).join(""),
    );
    expect(new Set(perCourt).size).toBeGreaterThan(1);
  });

  it("marks hours earlier today as past", () => {
    expect(slotState(1, "2026-08-06", 6, NOW)).toBe("past");
  });

  it("never marks a future date as past", () => {
    for (const h of SLOT_HOURS) {
      expect(slotState(1, "2026-08-20", h, NOW)).not.toBe("past");
    }
  });

  it("derives past purely from the injected now", () => {
    const later = new Date(2026, 7, 6, 23, 0);
    expect(slotState(1, "2026-08-06", 18, NOW)).not.toBe("past");
    expect(slotState(1, "2026-08-06", 18, later)).toBe("past");
  });

  it("books peak evening slots more often than off-peak", () => {
    const dates = bookingDates(NOW, 14);
    let peakBooked = 0;
    let peakTotal = 0;
    let offBooked = 0;
    let offTotal = 0;

    for (const court of COURTS) {
      for (const date of dates) {
        for (const hour of SLOT_HOURS) {
          const state = slotState(court.id, date, hour, NOW);
          if (state === "past") continue;
          const peak = hour >= 17;
          if (peak) {
            peakTotal++;
            if (state === "booked") peakBooked++;
          } else {
            offTotal++;
            if (state === "booked") offBooked++;
          }
        }
      }
    }

    expect(peakBooked / peakTotal).toBeGreaterThan(offBooked / offTotal);
  });
});

describe("bookingDates", () => {
  it("returns fourteen days by default, starting today", () => {
    const dates = bookingDates(NOW);
    expect(dates).toHaveLength(14);
    expect(dates[0]).toBe("2026-08-06");
    expect(dates[13]).toBe("2026-08-19");
  });

  it("rolls over month boundaries", () => {
    const dates = bookingDates(new Date(2026, 7, 30), 5);
    expect(dates).toEqual([
      "2026-08-30",
      "2026-08-31",
      "2026-09-01",
      "2026-09-02",
      "2026-09-03",
    ]);
  });

  it("does not shift the day for late-evening local times", () => {
    // toISOString() would report the next day here in any positive offset
    expect(bookingDates(new Date(2026, 7, 6, 23, 59), 1)[0]).toBe("2026-08-06");
  });
});

describe("formatHour", () => {
  it("zero-pads to a 24-hour label", () => {
    expect(formatHour(6)).toBe("06:00");
    expect(formatHour(18)).toBe("18:00");
  });
});

describe("formatDateLabel", () => {
  it("splits an ISO date into display parts", () => {
    expect(formatDateLabel("2026-08-06")).toEqual({
      weekday: "THU",
      day: "06",
      month: "AUG",
    });
  });
});

describe("openSlotCount", () => {
  it("counts only open slots", () => {
    const count = openSlotCount(2, "2026-08-12", NOW);
    const manual = SLOT_HOURS.filter(
      (h) => slotState(2, "2026-08-12", h, NOW) === "open",
    ).length;
    expect(count).toBe(manual);
  });

  it("never exceeds the number of slots in a day", () => {
    expect(openSlotCount(2, "2026-08-12", NOW)).toBeLessThanOrEqual(
      SLOT_HOURS.length,
    );
  });
});
```

- [ ] **Step 5: Run the test to verify it fails**

Run: `cd "/Users/danemmanuel/Documents/web experiments/fort" && pnpm test`
Expected: FAIL — `Failed to resolve import "./availability"`.

- [ ] **Step 6: Write the implementation**

Create `app/booking/availability.ts`:

```ts
/**
 * Seeded, deterministic court availability.
 *
 * Nothing here touches the network or the clock — `now` is always injected —
 * so the same court and date always produce the same grid. That matters more
 * than it sounds: a demo that reshuffles its "booked" slots on every reload
 * reads as fake the moment anyone scrolls back.
 */

export type Surface = "hard" | "clay";

export type Court = {
  id: number;
  label: string;
  surface: Surface;
  floodlit: boolean;
};

export type SlotState = "open" | "booked" | "past";

export const COURTS: Court[] = [
  { id: 1, label: "01", surface: "hard", floodlit: true },
  { id: 2, label: "02", surface: "hard", floodlit: true },
  { id: 3, label: "03", surface: "clay", floodlit: true },
  { id: 4, label: "04", surface: "hard", floodlit: true },
  { id: 5, label: "05", surface: "hard", floodlit: false },
  { id: 6, label: "06", surface: "clay", floodlit: true },
  { id: 7, label: "07", surface: "hard", floodlit: true },
  { id: 8, label: "08", surface: "hard", floodlit: false },
];

/** Courts close 14:00–15:00 — nobody plays outdoors through the Abuja afternoon. */
export const SLOT_HOURS: number[] = [
  6, 7, 8, 9, 10, 11, 12, 13, 16, 17, 18, 19, 20, 21,
];

const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const MONTHS = [
  "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
  "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
];

/** FNV-1a over the slot identity, normalised to 0..1. */
function seed(courtId: number, dateISO: string, hour: number): number {
  const key = `${courtId}:${dateISO}:${hour}`;
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}

/** Evening slots are the ones everyone wants, so they should mostly be gone. */
function bookedChance(hour: number): number {
  if (hour >= 17) return 0.62;
  if (hour <= 8) return 0.28;
  return 0.18;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function toISO(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function slotState(
  courtId: number,
  dateISO: string,
  hour: number,
  now: Date,
): SlotState {
  const [y, m, d] = dateISO.split("-").map(Number);
  const slot = new Date(y, m - 1, d, hour, 0, 0, 0);
  if (slot.getTime() <= now.getTime()) return "past";
  return seed(courtId, dateISO, hour) < bookedChance(hour) ? "booked" : "open";
}

export function bookingDates(now: Date, days = 14): string[] {
  const out: string[] = [];
  for (let i = 0; i < days; i++) {
    out.push(toISO(new Date(now.getFullYear(), now.getMonth(), now.getDate() + i)));
  }
  return out;
}

export function formatHour(hour: number): string {
  return `${pad(hour)}:00`;
}

export function formatDateLabel(dateISO: string): {
  weekday: string;
  day: string;
  month: string;
} {
  const [y, m, d] = dateISO.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return {
    weekday: WEEKDAYS[date.getDay()],
    day: pad(d),
    month: MONTHS[m - 1],
  };
}

export function openSlotCount(
  courtId: number,
  dateISO: string,
  now: Date,
): number {
  return SLOT_HOURS.filter(
    (h) => slotState(courtId, dateISO, h, now) === "open",
  ).length;
}
```

- [ ] **Step 7: Run the test to verify it passes**

Run: `pnpm test`
Expected: PASS — all tests green.

- [ ] **Step 8: Verify the production build still typechecks**

Run: `npx next build`
Expected: build succeeds.

- [ ] **Step 9: Commit**

```bash
git add package.json pnpm-lock.yaml vitest.config.ts app/booking/availability.ts app/booking/availability.test.ts
git commit -m "Add seeded court availability with vitest coverage"
```

---

### Task 2: Booking bus and overlay shell

Opens and closes an empty overlay from the landing page's CTAs. No steps yet — this task exists on its own because scroll-lock, focus restoration, and ScrollTrigger refresh are the parts most likely to break the page, and they deserve their own review gate.

**Files:**
- Create: `app/booking/bus.ts`
- Create: `app/booking/BookingOverlay.tsx`
- Create: `app/booking/booking.css`
- Modify: `app/page.tsx`
- Modify: `app/layout.tsx`
- Modify: `app/components/Landing.tsx`

**Interfaces:**
- Consumes: nothing from Task 1.
- Produces: `openBooking(): void`, `subscribeBooking(fn: () => void): () => void` from `bus.ts`; the `BookingOverlay` default export.

- [ ] **Step 1: Create the bus**

Create `app/booking/bus.ts`. This deliberately mirrors `app/components/pointer.ts` — the codebase already uses a module-level pub/sub to avoid prop drilling, and reusing the pattern keeps `page.tsx` a server component.

```ts
/**
 * Module-level open signal for the booking overlay.
 *
 * Lifting this into React state would mean a client component wrapping both
 * Landing and the overlay — and any re-render that remounts Landing reverts
 * its gsap.context(), permanently destroying every pinned ScrollTrigger.
 */
type Listener = () => void;

const listeners = new Set<Listener>();

export function openBooking(): void {
  listeners.forEach((fn) => fn());
}

export function subscribeBooking(fn: Listener): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
```

- [ ] **Step 2: Create the overlay shell**

Create `app/booking/BookingOverlay.tsx`:

```tsx
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
      subscribeBooking(() => {
        restoreTo.current = document.activeElement as HTMLElement | null;
        setOpen(true);
      }),
    [],
  );

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
      restoreTo.current?.focus?.();
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
          <button className="bk-close" onClick={close} aria-label="Close">
            <span />
            <span />
          </button>
        </header>
        <div className="bk-body" />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create the stylesheet**

Create `app/booking/booking.css`:

```css
/* ============================================================
   BOOKING OVERLAY
   ============================================================ */
.bk {
  position: fixed;
  inset: 0;
  z-index: 200;
  background: var(--navy);
  display: flex;
  flex-direction: column;
}

.bk-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  max-width: 1240px;
  width: 100%;
  margin: 0 auto;
  padding: 0 var(--pad);
}

.bk-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 26px 0;
  flex: 0 0 auto;
}

.bk-step-count {
  font-family: var(--font-satoshi), Inter, sans-serif;
  font-size: 16px;
  letter-spacing: 1.6px;
  text-transform: uppercase;
  color: var(--grey);
}

.bk-close {
  position: relative;
  width: 44px;
  height: 44px;
  background: none;
  border: 0;
  cursor: pointer;
  flex: 0 0 auto;
}
.bk-close span {
  position: absolute;
  left: 10px;
  top: 21px;
  width: 24px;
  height: 2px;
  background: #fff;
  transition: background 0.25s ease;
}
.bk-close span:nth-child(1) {
  transform: rotate(45deg);
}
.bk-close span:nth-child(2) {
  transform: rotate(-45deg);
}
.bk-close:hover span {
  background: var(--lime);
}

.bk-body {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 0;
  padding-bottom: 40px;
}

@media (max-width: 900px) {
  .bk-bar {
    padding: 16px 0;
  }
}
```

- [ ] **Step 4: Load the stylesheet**

In `app/layout.tsx`, add the import directly below the existing `import "./globals.css";`:

```ts
import "./booking/booking.css";
```

- [ ] **Step 5: Render the overlay as a sibling**

Replace the body of `app/page.tsx` entirely:

```tsx
import Landing from "./components/Landing";
import BookingOverlay from "./booking/BookingOverlay";

export default function Home() {
  return (
    <>
      <Landing />
      <BookingOverlay />
    </>
  );
}
```

Do **not** add `"use client"` to this file. Both children are already client components; the page itself stays a server component.

- [ ] **Step 6: Wire the CTAs**

In `app/components/Landing.tsx`, add to the imports:

```ts
import { openBooking } from "../booking/bus";
```

Then replace the hero's two anchors. Find:

```tsx
          <div className="hero-actions">
            <a className="btn btn-lime" href="#pricing">
              RESERVE A COURT
              <i className="btn-ico" aria-hidden="true" />
            </a>
            <a className="btn btn-ghost" href="#pricing">
              Join the Club
              <i className="btn-ico light" aria-hidden="true" />
            </a>
          </div>
```

Replace with:

```tsx
          <div className="hero-actions">
            <button className="btn btn-lime" onClick={openBooking}>
              RESERVE A COURT
              <i className="btn-ico" aria-hidden="true" />
            </button>
            <button className="btn btn-ghost" onClick={openBooking}>
              Join the Club
              <i className="btn-ico light" aria-hidden="true" />
            </button>
          </div>
```

Then the club section's anchor. Find:

```tsx
              <a className="btn btn-ghost reveal" href="#pricing">
                Join the Club
                <i className="btn-ico light" aria-hidden="true" />
              </a>
```

Replace with:

```tsx
              <button className="btn btn-ghost reveal" onClick={openBooking}>
                Join the Club
                <i className="btn-ico light" aria-hidden="true" />
              </button>
```

Then the pricing section's anchor. Find:

```tsx
              <a className="btn btn-lime reveal" href="#footer">
                CONTACT US
                <i className="btn-ico" aria-hidden="true" />
              </a>
```

Replace with:

```tsx
              <button className="btn btn-lime reveal" onClick={openBooking}>
                CONTACT US
                <i className="btn-ico" aria-hidden="true" />
              </button>
```

- [ ] **Step 7: Make `.btn` work as a button element**

`.btn` was written for anchors, so buttons inherit a border, the UA font, and centred text. In `app/globals.css`, find the `.btn` rule and add these four declarations to it:

```css
  border: 0;
  cursor: pointer;
  font: inherit;
  text-align: left;
```

Then add this rule immediately after the `.btn` block, so the shared font sizing still applies to buttons:

```css
button.btn {
  font-family: var(--font-jakob), sans-serif;
  font-weight: 400;
  font-size: 24px;
  line-height: 23px;
  letter-spacing: 0.4px;
}
```

- [ ] **Step 8: Verify the build**

Run: `npx next build`
Expected: build succeeds with no type errors.

- [ ] **Step 9: Verify by hand in the browser**

Run: `pnpm dev`, open `http://localhost:3000`, then check all of:
1. Clicking RESERVE A COURT opens a navy overlay with a close button.
2. ESC closes it; the X closes it.
3. After closing, the page is at the same scroll position it was before.
4. After closing, scroll down through the ball scene, the community gallery, and the coach carousel — **all three must still pin and animate.** If any section scrolls past without pinning, the ScrollTrigger refresh is broken; stop and fix before continuing.
5. Tab cycles only within the overlay while it is open.
6. Closing returns focus to the CTA that opened it.

- [ ] **Step 10: Commit**

```bash
git add app/booking/bus.ts app/booking/BookingOverlay.tsx app/booking/booking.css app/page.tsx app/layout.tsx app/components/Landing.tsx app/globals.css
git commit -m "Add booking overlay shell wired to the landing page CTAs"
```

---

### Task 3: Booking reducer

**Files:**
- Create: `app/booking/useBooking.ts`
- Create: `app/booking/useBooking.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `Step` (`0 | 1 | 2 | 3 | 4`); `BookingState`; `BookingAction`; `initialBooking: BookingState`; `bookingReducer(state: BookingState, action: BookingAction): BookingState`; `firstIncompleteStep(state: BookingState): Step`; `isName`, `isEmail`, `isPhone`, `detailsValid` predicates.

- [ ] **Step 1: Write the failing test**

Create `app/booking/useBooking.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  type BookingState,
  bookingReducer,
  detailsValid,
  firstIncompleteStep,
  initialBooking,
  isEmail,
  isName,
  isPhone,
} from "./useBooking";

const filled: BookingState = {
  ...initialBooking,
  step: 3,
  courtId: 3,
  date: "2026-08-08",
  hour: 18,
};

describe("bookingReducer", () => {
  it("starts on the court step with nothing chosen", () => {
    expect(initialBooking.step).toBe(0);
    expect(initialBooking.courtId).toBeNull();
  });

  it("advances to the date step when a court is picked", () => {
    const next = bookingReducer(initialBooking, {
      type: "SELECT_COURT",
      courtId: 4,
    });
    expect(next.courtId).toBe(4);
    expect(next.step).toBe(1);
  });

  it("clears a chosen hour when the court changes", () => {
    const next = bookingReducer(filled, { type: "SELECT_COURT", courtId: 7 });
    expect(next.hour).toBeNull();
  });

  it("clears a chosen hour when the date changes", () => {
    const next = bookingReducer(filled, {
      type: "SELECT_DATE",
      date: "2026-08-09",
    });
    expect(next.hour).toBeNull();
    expect(next.step).toBe(2);
  });

  it("advances to details when an hour is picked", () => {
    const next = bookingReducer(
      { ...filled, step: 2, hour: null },
      { type: "SELECT_HOUR", hour: 19 },
    );
    expect(next.hour).toBe(19);
    expect(next.step).toBe(3);
  });

  it("sets a single named field", () => {
    const next = bookingReducer(filled, {
      type: "SET_FIELD",
      field: "email",
      value: "a@b.co",
    });
    expect(next.email).toBe("a@b.co");
    expect(next.name).toBe("");
  });

  it("steps back without losing selections", () => {
    const next = bookingReducer(filled, { type: "BACK" });
    expect(next.step).toBe(2);
    expect(next.courtId).toBe(3);
  });

  it("does not step back past the first step", () => {
    expect(bookingReducer(initialBooking, { type: "BACK" }).step).toBe(0);
  });

  it("stores the reference and moves to confirmation", () => {
    const next = bookingReducer(filled, {
      type: "CONFIRM",
      reference: "FORT-A1B2C",
    });
    expect(next.reference).toBe("FORT-A1B2C");
    expect(next.step).toBe(4);
  });

  it("resets back to the initial state", () => {
    expect(bookingReducer(filled, { type: "RESET" })).toEqual(initialBooking);
  });
});

describe("firstIncompleteStep", () => {
  it("returns the court step when nothing is chosen", () => {
    expect(firstIncompleteStep(initialBooking)).toBe(0);
  });

  it("returns the date step when only a court is chosen", () => {
    expect(firstIncompleteStep({ ...initialBooking, courtId: 2 })).toBe(1);
  });

  it("returns the time step when the hour is still missing", () => {
    expect(
      firstIncompleteStep({ ...initialBooking, courtId: 2, date: "2026-08-08" }),
    ).toBe(2);
  });

  it("returns the details step once everything is chosen", () => {
    expect(firstIncompleteStep(filled)).toBe(3);
  });
});

describe("validation", () => {
  it("rejects a one-character name", () => {
    expect(isName("A")).toBe(false);
    expect(isName("Ada")).toBe(true);
  });

  it("rejects malformed email", () => {
    expect(isEmail("nope")).toBe(false);
    expect(isEmail("a@b")).toBe(false);
    expect(isEmail("ada@fort.ng")).toBe(true);
  });

  it("accepts local and international phone shapes", () => {
    expect(isPhone("0803")).toBe(false);
    expect(isPhone("08031234567")).toBe(true);
    expect(isPhone("+234 803 123 4567")).toBe(true);
  });

  it("requires all three fields together", () => {
    expect(detailsValid(filled)).toBe(false);
    expect(
      detailsValid({
        ...filled,
        name: "Ada",
        email: "ada@fort.ng",
        phone: "08031234567",
      }),
    ).toBe(true);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test`
Expected: FAIL — `Failed to resolve import "./useBooking"`.

- [ ] **Step 3: Write the implementation**

Create `app/booking/useBooking.ts`:

```ts
export type Step = 0 | 1 | 2 | 3 | 4;

export type BookingState = {
  step: Step;
  courtId: number | null;
  date: string | null;
  hour: number | null;
  name: string;
  email: string;
  phone: string;
  reference: string | null;
};

export type BookingAction =
  | { type: "SELECT_COURT"; courtId: number }
  | { type: "SELECT_DATE"; date: string }
  | { type: "SELECT_HOUR"; hour: number }
  | { type: "SET_FIELD"; field: "name" | "email" | "phone"; value: string }
  | { type: "BACK" }
  | { type: "CONFIRM"; reference: string }
  | { type: "RESET" };

export const initialBooking: BookingState = {
  step: 0,
  courtId: null,
  date: null,
  hour: null,
  name: "",
  email: "",
  phone: "",
  reference: null,
};

export function bookingReducer(
  state: BookingState,
  action: BookingAction,
): BookingState {
  switch (action.type) {
    case "SELECT_COURT":
      // a slot is only meaningful for one court, so changing court drops it
      return { ...state, courtId: action.courtId, hour: null, step: 1 };
    case "SELECT_DATE":
      return { ...state, date: action.date, hour: null, step: 2 };
    case "SELECT_HOUR":
      return { ...state, hour: action.hour, step: 3 };
    case "SET_FIELD":
      return { ...state, [action.field]: action.value };
    case "BACK":
      return { ...state, step: Math.max(0, state.step - 1) as Step };
    case "CONFIRM":
      return { ...state, reference: action.reference, step: 4 };
    case "RESET":
      return initialBooking;
    default:
      return state;
  }
}

/** Where the flow should sit given what has actually been chosen. */
export function firstIncompleteStep(state: BookingState): Step {
  if (state.courtId === null) return 0;
  if (state.date === null) return 1;
  if (state.hour === null) return 2;
  return 3;
}

export const isName = (v: string): boolean => v.trim().length >= 2;

export const isEmail = (v: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());

export const isPhone = (v: string): boolean =>
  /^[+\d][\d\s-]{6,}$/.test(v.trim());

export const detailsValid = (s: BookingState): boolean =>
  isName(s.name) && isEmail(s.email) && isPhone(s.phone);
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test`
Expected: PASS — both test files green.

- [ ] **Step 5: Commit**

```bash
git add app/booking/useBooking.ts app/booking/useBooking.test.ts
git commit -m "Add booking reducer and field validation"
```

---

### Task 4: Court and date steps

**Files:**
- Create: `app/booking/steps/CourtStep.tsx`
- Create: `app/booking/steps/DateStep.tsx`
- Modify: `app/booking/BookingOverlay.tsx`
- Modify: `app/booking/booking.css`

**Interfaces:**
- Consumes: `COURTS`, `bookingDates`, `formatDateLabel`, `openSlotCount` from `./availability`; `bookingReducer`, `initialBooking`, `firstIncompleteStep` from `./useBooking`; `subscribeBooking` from `./bus`.
- Produces: `CourtStep` default export taking `{ value: number | null, onSelect: (courtId: number) => void }`; `DateStep` default export taking `{ courtId: number, now: Date, value: string | null, onSelect: (date: string) => void }`.

- [ ] **Step 1: Create the court step**

Create `app/booking/steps/CourtStep.tsx`:

```tsx
"use client";

import { COURTS } from "../availability";

export default function CourtStep({
  value,
  onSelect,
}: {
  value: number | null;
  onSelect: (courtId: number) => void;
}) {
  return (
    <>
      <h2 className="bk-h">SELECT YOUR COURT<em>.</em></h2>
      <div className="bk-grid bk-grid-court">
        {COURTS.map((court) => (
          <button
            key={court.id}
            className={`bk-tile${value === court.id ? " is-on" : ""}`}
            onClick={() => onSelect(court.id)}
            aria-pressed={value === court.id}
          >
            <span className="bk-tile-num">{court.label}</span>
            <span className="bk-tile-meta">
              {court.surface === "hard" ? "HARD COURT" : "CLAY COURT"}
            </span>
            <span className="bk-tile-meta dim">
              {court.floodlit ? "FLOODLIT" : "DAYLIGHT ONLY"}
            </span>
          </button>
        ))}
      </div>
    </>
  );
}
```

- [ ] **Step 2: Create the date step**

Create `app/booking/steps/DateStep.tsx`. It shows the remaining open slots per day, which is what makes the picker feel like it is reading from something real.

```tsx
"use client";

import { bookingDates, formatDateLabel, openSlotCount } from "../availability";

export default function DateStep({
  courtId,
  now,
  value,
  onSelect,
}: {
  courtId: number;
  now: Date;
  value: string | null;
  onSelect: (date: string) => void;
}) {
  const dates = bookingDates(now);

  return (
    <>
      <h2 className="bk-h">PICK A DAY<em>.</em></h2>
      <div className="bk-grid bk-grid-date">
        {dates.map((date) => {
          const { weekday, day, month } = formatDateLabel(date);
          const free = openSlotCount(courtId, date, now);
          return (
            <button
              key={date}
              className={`bk-tile bk-date${value === date ? " is-on" : ""}${
                free === 0 ? " is-off" : ""
              }`}
              onClick={() => onSelect(date)}
              disabled={free === 0}
              aria-pressed={value === date}
              aria-label={`${weekday} ${day} ${month}, ${free} slots free`}
            >
              <span className="bk-tile-meta">{weekday}</span>
              <span className="bk-tile-num">{day}</span>
              <span className="bk-tile-meta dim">{month}</span>
              <span className="bk-free">{free} FREE</span>
            </button>
          );
        })}
      </div>
    </>
  );
}
```

- [ ] **Step 3: Wire both steps into the overlay**

Rewrite `app/booking/BookingOverlay.tsx` completely. This replaces the placeholder `<div className="bk-body" />` with the reducer, the step router, and the back/progress chrome. Later tasks extend the `switch`.

```tsx
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

  const close = useCallback(() => setOpen(false), []);

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
      subscribeBooking(() => {
        restoreTo.current = document.activeElement as HTMLElement | null;
        // read the clock at open time — never at module scope, which would
        // bake a stale "now" into the bundle
        setNow(new Date());
        dispatch({ type: "RESET" });
        setOpen(true);
      }),
    [],
  );

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
      ScrollTrigger.refresh();
      restoreTo.current?.focus?.();
    };
  }, [open]);

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
          <button className="bk-close" onClick={close} aria-label="Close">
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
              onSelect={(date) => advance(() => dispatch({ type: "SELECT_DATE", date }))}
            />
          )}
        </div>
      </div>
    </div>
  );
}
```

All three selection steps route through `advance`, so the tile's selected state is visible for a beat before the step changes. Dispatching immediately would swap the screen before the lime fill ever renders.

- [ ] **Step 4: Add the step styles**

Append to `app/booking/booking.css`:

```css
.bk-back {
  background: none;
  border: 0;
  padding: 0;
  cursor: pointer;
  font-family: var(--font-satoshi), Inter, sans-serif;
  font-size: 16px;
  letter-spacing: 1.6px;
  color: var(--grey);
  transition: color 0.25s ease;
}
.bk-back:hover {
  color: var(--lime);
}

.bk-rail {
  position: relative;
  height: 2px;
  background: rgba(255, 255, 255, 0.18);
  flex: 0 0 auto;
}
.bk-rail span {
  position: absolute;
  left: 0;
  top: 0;
  height: 2px;
  background: var(--lime);
  transition: width 0.45s cubic-bezier(0.22, 1, 0.36, 1);
}

.bk-h {
  font-family: var(--font-jakob), sans-serif;
  font-weight: 400;
  font-size: 42px;
  line-height: 1.2;
  letter-spacing: 0.42px;
  text-transform: uppercase;
  margin: 0 0 36px;
}
.bk-h em {
  font-style: normal;
  color: var(--lime);
}

.bk-grid {
  display: grid;
  gap: 14px;
}
.bk-grid-court {
  grid-template-columns: repeat(4, 1fr);
}
.bk-grid-date {
  grid-template-columns: repeat(7, 1fr);
}

.bk-tile {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  padding: 20px;
  border: 0;
  border-radius: 14px;
  cursor: pointer;
  text-align: left;
  background: rgba(255, 255, 255, 0.07);
  color: #fff;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.14);
  transition:
    background 0.28s ease,
    transform 0.28s cubic-bezier(0.22, 1, 0.36, 1),
    box-shadow 0.28s ease;
}
.bk-tile:hover:not(:disabled) {
  transform: translateY(-3px);
  box-shadow: inset 0 0 0 1px rgba(204, 255, 0, 0.5);
}
.bk-tile.is-on {
  background: var(--lime);
  color: var(--navy);
  box-shadow: inset 0 0 0 1px var(--lime);
}
.bk-tile.is-off,
.bk-tile:disabled {
  opacity: 0.32;
  cursor: not-allowed;
}

.bk-tile-num {
  font-family: var(--font-jakob), sans-serif;
  font-size: 34px;
  line-height: 1;
}
.bk-tile-meta {
  font-family: var(--font-satoshi), Inter, sans-serif;
  font-size: 13px;
  letter-spacing: 1.2px;
}
.bk-tile-meta.dim {
  color: var(--grey);
}
.bk-tile.is-on .bk-tile-meta.dim {
  color: rgba(2, 16, 36, 0.62);
}

.bk-date {
  align-items: center;
  text-align: center;
  padding: 16px 8px;
}
.bk-free {
  font-family: var(--font-satoshi), Inter, sans-serif;
  font-size: 11px;
  letter-spacing: 1px;
  color: var(--lime);
}
.bk-tile.is-on .bk-free {
  color: var(--navy);
}

@media (max-width: 900px) {
  .bk-h {
    font-size: 28px;
    margin-bottom: 24px;
  }
  .bk-grid-court {
    grid-template-columns: repeat(2, 1fr);
  }
  .bk-grid-date {
    grid-template-columns: repeat(4, 1fr);
  }
  .bk-body {
    justify-content: flex-start;
    padding-top: 28px;
    overflow-y: auto;
  }
}
```

- [ ] **Step 5: Verify the build**

Run: `npx next build && pnpm test`
Expected: both succeed.

- [ ] **Step 6: Verify by hand**

Run `pnpm dev` and check: the court grid shows 8 tiles; picking one advances to a 14-day date grid; each day shows a free-slot count; the same day always shows the same count across reopens; BACK returns to the court grid with the selection intact; the progress rail fills.

- [ ] **Step 7: Commit**

```bash
git add app/booking/steps/CourtStep.tsx app/booking/steps/DateStep.tsx app/booking/BookingOverlay.tsx app/booking/booking.css
git commit -m "Add court and date steps to the booking overlay"
```

---

### Task 5: Time step

**Files:**
- Create: `app/booking/steps/TimeStep.tsx`
- Modify: `app/booking/BookingOverlay.tsx`
- Modify: `app/booking/booking.css`

**Interfaces:**
- Consumes: `COURTS`, `SLOT_HOURS`, `formatHour`, `formatDateLabel`, `slotState` from `../availability`.
- Produces: `TimeStep` default export taking `{ courtId, date, now, value, onSelect }`.

- [ ] **Step 1: Create the time step**

Create `app/booking/steps/TimeStep.tsx`:

```tsx
"use client";

import {
  COURTS,
  SLOT_HOURS,
  formatDateLabel,
  formatHour,
  slotState,
} from "../availability";

export default function TimeStep({
  courtId,
  date,
  now,
  value,
  onSelect,
}: {
  courtId: number;
  date: string;
  now: Date;
  value: number | null;
  onSelect: (hour: number) => void;
}) {
  const court = COURTS.find((c) => c.id === courtId);
  const { weekday, day, month } = formatDateLabel(date);

  const states = SLOT_HOURS.map((hour) => ({
    hour,
    state: slotState(courtId, date, hour, now),
  }));
  const peakLeft = states.filter(
    (s) => s.hour >= 17 && s.state === "open",
  ).length;

  return (
    <>
      <h2 className="bk-h">SELECT A TIME<em>.</em></h2>
      <p className="bk-context">
        COURT {court?.label} — {weekday} {day} {month}
      </p>

      <div className="bk-grid bk-grid-time">
        {states.map(({ hour, state }) => {
          const taken = state !== "open";
          return (
            <button
              key={hour}
              className={`bk-slot${value === hour ? " is-on" : ""}${
                taken ? " is-off" : ""
              }`}
              onClick={() => onSelect(hour)}
              disabled={taken}
              aria-disabled={taken}
              aria-pressed={value === hour}
              aria-label={
                state === "open"
                  ? `${formatHour(hour)}, available`
                  : state === "booked"
                    ? `${formatHour(hour)}, already booked`
                    : `${formatHour(hour)}, no longer available today`
              }
            >
              {formatHour(hour)}
            </button>
          );
        })}
      </div>

      <p className="bk-note">
        {peakLeft === 0
          ? "No peak evening slots left — try an earlier hour."
          : `${peakLeft} slot${peakLeft === 1 ? "" : "s"} left at peak this evening`}
      </p>
    </>
  );
}
```

- [ ] **Step 2: Wire it into the overlay**

In `app/booking/BookingOverlay.tsx`, add to the imports:

```ts
import TimeStep from "./steps/TimeStep";
```

Then add this block inside `.bk-body`, immediately after the `step === 1` block:

```tsx
          {step === 2 && state.courtId !== null && state.date !== null && (
            <TimeStep
              courtId={state.courtId}
              date={state.date}
              now={now}
              value={state.hour}
              onSelect={(hour) => advance(() => dispatch({ type: "SELECT_HOUR", hour }))}
            />
          )}
```

- [ ] **Step 3: Add the time styles**

Append to `app/booking/booking.css`:

```css
.bk-context {
  font-family: var(--font-satoshi), Inter, sans-serif;
  font-size: 14px;
  letter-spacing: 1.4px;
  color: var(--grey);
  margin: -22px 0 28px;
}

.bk-grid-time {
  grid-template-columns: repeat(7, 1fr);
}

.bk-slot {
  position: relative;
  padding: 22px 8px;
  border: 0;
  border-radius: 12px;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.07);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.14);
  color: #fff;
  font-family: var(--font-jakob), sans-serif;
  font-size: 20px;
  letter-spacing: 0.4px;
  transition:
    background 0.28s ease,
    transform 0.28s cubic-bezier(0.22, 1, 0.36, 1),
    box-shadow 0.28s ease;
}
.bk-slot:hover:not(:disabled) {
  transform: translateY(-3px);
  box-shadow: inset 0 0 0 1px rgba(204, 255, 0, 0.5);
}
.bk-slot.is-on {
  background: var(--lime);
  color: var(--navy);
}
.bk-slot.is-off {
  opacity: 0.3;
  cursor: not-allowed;
  color: var(--grey);
}
/* struck through rather than merely dimmed, so the state does not rely on colour */
.bk-slot.is-off::after {
  content: "";
  position: absolute;
  left: 18%;
  right: 18%;
  top: 50%;
  height: 1px;
  background: currentColor;
}

.bk-note {
  font-family: var(--font-satoshi), Inter, sans-serif;
  font-size: 14px;
  letter-spacing: 1.2px;
  color: var(--lime);
  margin: 28px 0 0;
}

@media (max-width: 900px) {
  .bk-grid-time {
    grid-template-columns: repeat(3, 1fr);
  }
  .bk-context {
    margin-top: -14px;
  }
}
```

- [ ] **Step 4: Verify**

Run: `npx next build && pnpm test`
Expected: both succeed.

Then `pnpm dev` and check: some slots are struck through and unclickable; reopening the overlay and picking the same court and date shows **exactly the same** booked slots; picking a different court changes the pattern; today's already-passed hours are struck through.

- [ ] **Step 5: Commit**

```bash
git add app/booking/steps/TimeStep.tsx app/booking/BookingOverlay.tsx app/booking/booking.css
git commit -m "Add time step with seeded slot availability"
```

---

### Task 6: Details and confirmation steps

**Files:**
- Create: `app/booking/steps/DetailsStep.tsx`
- Create: `app/booking/steps/ConfirmStep.tsx`
- Modify: `app/booking/BookingOverlay.tsx`
- Modify: `app/booking/booking.css`

**Interfaces:**
- Consumes: `detailsValid`, `isEmail`, `isName`, `isPhone`, `BookingState` from `../useBooking`; `COURTS`, `formatDateLabel`, `formatHour` from `../availability`.
- Produces: `DetailsStep` taking `{ state, onField, onSubmit }`; `ConfirmStep` taking `{ state, onClose }`.

- [ ] **Step 1: Create the details step**

Create `app/booking/steps/DetailsStep.tsx`:

```tsx
"use client";

import { useState } from "react";
import { COURTS, formatDateLabel, formatHour } from "../availability";
import {
  type BookingState,
  detailsValid,
  isEmail,
  isName,
  isPhone,
} from "../useBooking";

type Field = "name" | "email" | "phone";

const RULES: Record<Field, { test: (v: string) => boolean; error: string }> = {
  name: { test: isName, error: "Enter your full name" },
  email: { test: isEmail, error: "Enter a valid email address" },
  phone: { test: isPhone, error: "Enter a reachable phone number" },
};

export default function DetailsStep({
  state,
  onField,
  onSubmit,
}: {
  state: BookingState;
  onField: (field: Field, value: string) => void;
  onSubmit: () => void;
}) {
  const [touched, setTouched] = useState<Record<Field, boolean>>({
    name: false,
    email: false,
    phone: false,
  });

  const court = COURTS.find((c) => c.id === state.courtId);
  const label = state.date ? formatDateLabel(state.date) : null;

  const errorFor = (field: Field): string | null => {
    if (!touched[field]) return null;
    return RULES[field].test(state[field]) ? null : RULES[field].error;
  };

  return (
    <>
      <h2 className="bk-h">ALMOST THERE<em>.</em></h2>

      <div className="bk-summary">
        <span>COURT {court?.label}</span>
        <span>
          {label ? `${label.weekday} ${label.day} ${label.month}` : ""}
        </span>
        <span>{state.hour !== null ? formatHour(state.hour) : ""}</span>
      </div>

      <form
        className="bk-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (detailsValid(state)) onSubmit();
        }}
      >
        {(["name", "email", "phone"] as Field[]).map((field) => {
          const error = errorFor(field);
          return (
            <label className="bk-field" key={field}>
              <span className="bk-label">
                {field === "name"
                  ? "FULL NAME"
                  : field === "email"
                    ? "EMAIL"
                    : "PHONE"}
              </span>
              <input
                className={error ? "has-error" : undefined}
                type={field === "email" ? "email" : field === "phone" ? "tel" : "text"}
                value={state[field]}
                onChange={(e) => onField(field, e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, [field]: true }))}
                aria-invalid={error !== null}
                autoComplete={
                  field === "name" ? "name" : field === "email" ? "email" : "tel"
                }
              />
              {error && <span className="bk-error">{error}</span>}
            </label>
          );
        })}

        <button
          className="btn btn-lime bk-submit"
          type="submit"
          disabled={!detailsValid(state)}
        >
          CONFIRM BOOKING
          <i className="btn-ico" aria-hidden="true" />
        </button>
      </form>
    </>
  );
}
```

- [ ] **Step 2: Create the confirmation step**

Create `app/booking/steps/ConfirmStep.tsx`:

```tsx
"use client";

import { COURTS, formatDateLabel, formatHour } from "../availability";
import type { BookingState } from "../useBooking";

export default function ConfirmStep({
  state,
  onClose,
}: {
  state: BookingState;
  onClose: () => void;
}) {
  const court = COURTS.find((c) => c.id === state.courtId);
  const label = state.date ? formatDateLabel(state.date) : null;

  return (
    <div className="bk-done">
      <span className="bk-done-mark" aria-hidden="true" />
      <h2 className="bk-h">YOU&rsquo;RE ON<em>.</em></h2>
      <p className="bk-done-line">
        Court {court?.label} ·{" "}
        {label ? `${label.weekday} ${label.day} ${label.month}` : ""} ·{" "}
        {state.hour !== null ? formatHour(state.hour) : ""}
      </p>
      <p className="bk-ref">
        <span>BOOKING REFERENCE</span>
        <strong>{state.reference}</strong>
      </p>
      <p className="bk-done-note">
        Bring the reference to the front desk. See you on court, {state.name.trim().split(" ")[0]}.
      </p>
      <button className="btn btn-lime" onClick={onClose}>
        DONE
        <i className="btn-ico" aria-hidden="true" />
      </button>
    </div>
  );
}
```

- [ ] **Step 3: Wire both into the overlay**

In `app/booking/BookingOverlay.tsx`, add to the imports:

```ts
import DetailsStep from "./steps/DetailsStep";
import ConfirmStep from "./steps/ConfirmStep";
```

Add this helper above the component, after the `ADVANCE_MS` constant:

```ts
/** Reference is generated here, not in the reducer, so the reducer stays pure. */
const makeReference = (): string =>
  `FORT-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
```

Then add these two blocks inside `.bk-body`, after the `step === 2` block:

```tsx
          {step === 3 && (
            <DetailsStep
              state={state}
              onField={(field, value) =>
                dispatch({ type: "SET_FIELD", field, value })
              }
              onSubmit={() =>
                dispatch({ type: "CONFIRM", reference: makeReference() })
              }
            />
          )}
```

The confirmation is rendered from `state.step`, not the clamped `step` — `firstIncompleteStep` caps at 3, so the clamped value can never reach 4. Add it as a sibling of the `.bk-body` switch by changing the `step` computation line from:

```tsx
  const step = Math.min(state.step, firstIncompleteStep(state));
```

to:

```tsx
  const done = state.step === 4;
  const step = done ? 4 : Math.min(state.step, firstIncompleteStep(state));
```

Then wrap the header and rail so they hide on the confirmation screen. Replace the `<header>` and `<div className="bk-rail">` blocks with:

```tsx
        <header className="bk-bar">
          {step > 0 && !done ? (
            <button
              className="bk-back"
              onClick={() => dispatch({ type: "BACK" })}
            >
              ← BACK
            </button>
          ) : (
            <span className="bk-step-count">RESERVE A COURT</span>
          )}
          {!done && (
            <span className="bk-step-count">
              {String(step + 1).padStart(2, "0")} / 04
            </span>
          )}
          <button className="bk-close" onClick={close} aria-label="Close">
            <span />
            <span />
          </button>
        </header>

        {!done && (
          <div className="bk-rail" aria-hidden="true">
            <span style={{ width: `${((step + 1) / 4) * 100}%` }} />
          </div>
        )}
```

And add the confirmation inside `.bk-body`, after the `step === 3` block:

```tsx
          {done && <ConfirmStep state={state} onClose={close} />}
```

- [ ] **Step 4: Add the form and confirmation styles**

Append to `app/booking/booking.css`:

```css
.bk-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin: -22px 0 32px;
}
.bk-summary span {
  font-family: var(--font-satoshi), Inter, sans-serif;
  font-size: 13px;
  letter-spacing: 1.3px;
  padding: 8px 14px;
  border-radius: 50px;
  background: rgba(204, 255, 0, 0.12);
  color: var(--lime);
}

.bk-form {
  display: flex;
  flex-direction: column;
  gap: 22px;
  max-width: 520px;
}
.bk-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.bk-label {
  font-family: var(--font-satoshi), Inter, sans-serif;
  font-size: 12px;
  letter-spacing: 1.4px;
  color: var(--grey);
}
.bk-field input {
  background: rgba(255, 255, 255, 0.07);
  border: 0;
  border-radius: 10px;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.16);
  padding: 15px 16px;
  color: #fff;
  font-family: var(--font-inter), Inter, sans-serif;
  font-size: 18px;
  transition: box-shadow 0.25s ease;
}
.bk-field input:focus {
  outline: none;
  box-shadow: inset 0 0 0 1px var(--lime);
}
.bk-field input.has-error {
  box-shadow: inset 0 0 0 1px #ff6b6b;
}
.bk-error {
  font-family: var(--font-satoshi), Inter, sans-serif;
  font-size: 13px;
  color: #ff6b6b;
}

.bk-submit {
  align-self: flex-start;
  margin-top: 6px;
}
.bk-submit:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: none;
}

.bk-done {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 18px;
  max-width: 560px;
}
.bk-done-mark {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--lime)
    url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23021024' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'><polyline points='4 12 10 18 20 6'/></svg>")
    center / 26px 26px no-repeat;
}
.bk-done .bk-h {
  margin: 0;
}
.bk-done-line {
  font-family: var(--font-inter), Inter, sans-serif;
  font-size: 20px;
  letter-spacing: 0.4px;
  margin: 0;
}
.bk-ref {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 8px 0 0;
  padding: 18px 22px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.07);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.14);
}
.bk-ref span {
  font-family: var(--font-satoshi), Inter, sans-serif;
  font-size: 12px;
  letter-spacing: 1.4px;
  color: var(--grey);
}
.bk-ref strong {
  font-family: var(--font-jakob), sans-serif;
  font-weight: 400;
  font-size: 32px;
  letter-spacing: 1px;
  color: var(--lime);
}
.bk-done-note {
  font-family: var(--font-inter), Inter, sans-serif;
  font-size: 17px;
  color: var(--grey);
  margin: 0;
}

@media (max-width: 900px) {
  .bk-ref strong {
    font-size: 26px;
  }
  .bk-done-line {
    font-size: 17px;
  }
}
```

- [ ] **Step 5: Verify**

Run: `npx next build && pnpm test`
Expected: both succeed.

Then `pnpm dev` and walk the whole flow: pick a court, a day, a time; the summary chips show all three; the submit button stays disabled until all three fields validate; blurring an empty field shows an inline error; submitting shows the confirmation with a reference; DONE closes the overlay; reopening starts fresh at the court step.

- [ ] **Step 6: Commit**

```bash
git add app/booking/steps/DetailsStep.tsx app/booking/steps/ConfirmStep.tsx app/booking/BookingOverlay.tsx app/booking/booking.css
git commit -m "Add details and confirmation steps to the booking flow"
```

---

### Task 7: Motion, reduced-motion, and grid keyboard navigation

**Files:**
- Create: `app/booking/gridKeys.ts`
- Modify: `app/booking/BookingOverlay.tsx`
- Modify: `app/booking/booking.css`
- Modify: `app/booking/steps/CourtStep.tsx`
- Modify: `app/booking/steps/DateStep.tsx`
- Modify: `app/booking/steps/TimeStep.tsx`
- Modify: `app/components/Landing.tsx`

**Interfaces:**
- Consumes: `gsap` from `gsap`.
- Produces: `onGridKeyDown(e: React.KeyboardEvent<HTMLElement>): void` from `gridKeys.ts`.

- [ ] **Step 1: Animate the overlay in**

In `app/booking/BookingOverlay.tsx`, add to the imports:

```ts
import { useLayoutEffect } from "react";
import gsap from "gsap";
```

Merge `useLayoutEffect` into the existing `react` import rather than adding a second import statement.

Add a ref beside the others:

```ts
  const shell = useRef<HTMLDivElement>(null);
```

Add this effect after the focus effect. Position and scale ride separate tweens — one tween would force them to share an ease, which is exactly the bug that flattened the ball scene during the original port.

```tsx
  useLayoutEffect(() => {
    if (!open || !shell.current || !panel.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        shell.current,
        { yPercent: 100 },
        { yPercent: 0, duration: 0.62, ease: "power3.out" },
      );
      gsap.fromTo(
        panel.current,
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: 0.4, delay: 0.16, ease: "power2.out" },
      );
    }, shell);

    return () => ctx.revert();
  }, [open]);
```

Attach the ref to the outer element by changing:

```tsx
    <div
      className="bk"
      role="dialog"
```

to:

```tsx
    <div
      className="bk"
      ref={shell}
      role="dialog"
```

- [ ] **Step 2: Stagger the grid tiles**

Add this effect immediately after the one from Step 1:

```tsx
  useLayoutEffect(() => {
    if (!open || !panel.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const tiles = panel.current.querySelectorAll(".bk-tile, .bk-slot");
    if (!tiles.length) return;

    const tween = gsap.fromTo(
      tiles,
      { autoAlpha: 0, y: 14 },
      {
        autoAlpha: 1,
        y: 0,
        duration: 0.42,
        ease: "power2.out",
        stagger: 0.018,
        overwrite: true,
      },
    );

    return () => {
      tween.kill();
      gsap.set(tiles, { clearProps: "all" });
    };
  }, [open, step]);
```

This effect reads `step`, which is computed after the early return. Move the `const done` / `const step` lines from below the `if (!open || !now) return null;` guard to **above** all the effects, and change the guard's dependants accordingly — the computation only reads `state`, so it is safe to run unconditionally:

```tsx
  const done = state.step === 4;
  const step = done ? 4 : Math.min(state.step, firstIncompleteStep(state));
```

Place these two lines directly after the `useReducer` call. Then the `if (!open || !now) return null;` guard stays where it is, immediately before the returned JSX.

- [ ] **Step 3: Honour reduced motion on the landing page too**

The main page currently honours `prefers-reduced-motion` only for `scroll-behavior`. In `app/components/Landing.tsx`, inside the `useIsomorphicLayoutEffect`, add this immediately after `gsap.registerPlugin(ScrollTrigger);`:

```ts
    // Scroll-linked scrubbing is the exact motion this setting exists to stop.
    // Bail before creating any scene; the page still reads fine statically.
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      gsap.set(".reveal", { autoAlpha: 1, y: 0, filter: "none" });
      STATS.forEach((stat, i) => {
        const el = document.querySelectorAll<HTMLElement>(".stat-num")[i];
        if (el) el.textContent = stat.value + stat.suffix;
      });
      return;
    }
```

- [ ] **Step 4: Add the reduced-motion CSS fallback**

Append to `app/booking/booking.css`:

```css
@media (prefers-reduced-motion: reduce) {
  .bk-tile,
  .bk-slot,
  .bk-rail span {
    transition: none;
  }
  .bk-tile:hover:not(:disabled),
  .bk-slot:hover:not(:disabled) {
    transform: none;
  }
}
```

- [ ] **Step 5: Add the grid key handler**

Create `app/booking/gridKeys.ts`. Arrow keys move focus between enabled tiles; disabled tiles are skipped, because landing focus on a struck-through slot the user cannot pick is a dead end.

```ts
import type { KeyboardEvent } from "react";

const STEP: Record<string, number> = {
  ArrowRight: 1,
  ArrowLeft: -1,
  ArrowDown: 1,
  ArrowUp: -1,
};

/**
 * Roving focus across a .bk-grid. Columns are read from the live computed
 * style rather than hard-coded, so the same handler works at every breakpoint.
 */
export function onGridKeyDown(e: KeyboardEvent<HTMLElement>): void {
  const key = e.key;
  if (!(key in STEP) && key !== "Home" && key !== "End") return;

  const grid = e.currentTarget;
  const items = Array.from(
    grid.querySelectorAll<HTMLButtonElement>("button:not([disabled])"),
  );
  if (!items.length) return;

  const index = items.indexOf(document.activeElement as HTMLButtonElement);
  if (index === -1) return;

  e.preventDefault();

  if (key === "Home") {
    items[0].focus();
    return;
  }
  if (key === "End") {
    items[items.length - 1].focus();
    return;
  }

  const columns = Math.max(
    1,
    window
      .getComputedStyle(grid)
      .gridTemplateColumns.split(" ")
      .filter(Boolean).length,
  );

  const stride = key === "ArrowUp" || key === "ArrowDown" ? columns : 1;
  const next = index + STEP[key] * stride;
  if (next >= 0 && next < items.length) items[next].focus();
}
```

- [ ] **Step 6: Wire it into the three grids**

In `app/booking/steps/CourtStep.tsx`, add the import:

```ts
import { onGridKeyDown } from "../gridKeys";
```

and change `<div className="bk-grid bk-grid-court">` to:

```tsx
      <div className="bk-grid bk-grid-court" onKeyDown={onGridKeyDown}>
```

In `app/booking/steps/DateStep.tsx`, add the same import and change `<div className="bk-grid bk-grid-date">` to:

```tsx
      <div className="bk-grid bk-grid-date" onKeyDown={onGridKeyDown}>
```

In `app/booking/steps/TimeStep.tsx`, add the same import and change `<div className="bk-grid bk-grid-time">` to:

```tsx
      <div className="bk-grid bk-grid-time" onKeyDown={onGridKeyDown}>
```

- [ ] **Step 7: Verify**

Run: `npx next build && pnpm test`
Expected: both succeed.

Then `pnpm dev` and check: the overlay wipes up from the bottom; tiles stagger in on each step; the page behind still pins correctly after closing. On each grid, arrow keys move focus and skip over disabled slots; Home and End jump to the first and last selectable tile.

Then enable **System Settings → Accessibility → Display → Reduce motion** on macOS and reload. Check: the overlay appears with no wipe, tiles appear with no stagger, the landing page renders all `.reveal` content visible, stat numbers show their final values, and no section pins or scrubs.

- [ ] **Step 8: Commit**

```bash
git add app/booking/gridKeys.ts app/booking/BookingOverlay.tsx app/booking/booking.css app/booking/steps app/components/Landing.tsx
git commit -m "Animate the booking overlay, honour reduced-motion, add grid key nav"
```

---

## Notes for the implementer

- The repo currently has **all of the landing page's real work untracked** (`app/components/`, `app/content.ts`, `app/fonts.ts`, `app/fonts/`, `public/media/`, plus modifications to `globals.css`, `layout.tsx`, `page.tsx`). Ask before committing any of it — the commits in this plan deliberately touch only the files each task creates or modifies, but `git add` on a modified shared file like `globals.css` will pick up pre-existing uncommitted changes. Check `git diff --staged` before every commit.
- `AGENTS.md` is regenerated by `next dev`. If it shows up modified, commit it alongside the work rather than reverting it.
- The stock photos in `public/media/` are **padel, not tennis**, and are being replaced separately. Ignore them.
