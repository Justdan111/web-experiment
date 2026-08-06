# FORT — Court Booking Overlay

**Date:** 2026-08-06
**Status:** Approved

## Purpose

Every call-to-action on the FORT landing page is currently a dead anchor: "RESERVE A COURT" and "Join the Club" both point at `#pricing`, "CONTACT US" points at `#footer`. The page is visually finished and functionally hollow. This spec covers the booking flow that fills them.

FORT is a **portfolio piece**. It must be convincing, not operational. There is no database, no mail provider, no vendor account, and no persistence. A booking should feel real for the length of a demo and then evaporate.

## Scope

A full-screen overlay opened from the landing page's CTAs, running four steps — **court → date → time → details** — followed by an animated confirmation.

Explicitly out of scope: real reservations, payment, accounts, admin views, email, and any second route.

## Architecture

### Wiring, and why it is shaped this way

All six of the landing page's GSAP scenes live in a single `gsap.context()` inside `Landing.tsx`, whose cleanup calls `ctx.revert()`. If `Landing` unmounts when the overlay opens, every pinned `ScrollTrigger` — the ball scene, the zoom gallery, the coach carousel — is destroyed and does not return when the overlay closes. The page silently loses its motion.

The overlay therefore must never sit anywhere that remounts `Landing`. Rather than rely on remembering that, the structure makes it impossible:

- `app/booking/bus.ts` — a module-level pub/sub exposing `openBooking()`. This mirrors the existing `app/components/pointer.ts`, which already solves the same problem for the particle balls.
- `page.tsx` renders `<Landing />` and `<BookingOverlay />` as **siblings** and stays a server component.
- `BookingOverlay` owns its own open state and subscribes to the bus. A CTA click never touches `Landing`'s tree.

On close, call `ScrollTrigger.refresh()`: locking and unlocking body scroll changes document height, which invalidates every pin's cached start/end positions.

### Files

    app/booking/
      bus.ts               open/subscribe, mirrors pointer.ts
      BookingOverlay.tsx   shell: GSAP open/close, focus trap, ESC, scroll lock
      useBooking.ts        reducer holding step + selections
      availability.ts      pure, React-free, seeded slot state
      booking.css          imported from layout.tsx
      steps/
        CourtStep.tsx
        DateStep.tsx
        TimeStep.tsx
        DetailsStep.tsx
        ConfirmStep.tsx

`booking.css` is separate so `globals.css` does not grow past its current 1054 lines. Styling follows the existing convention: hand-written semantic classes, not Tailwind utilities. The `:root` design tokens in `globals.css` are already global and available.

## Data

### Courts

Eight courts, because the stats section on the page claims "8 WORLD CLASS COURTS". A picker that contradicts the page's own copy undermines the whole illusion.

Each court carries an id, a display number, a surface, and a floodlit flag.

### Availability

```
slotState(courtId, dateISO, hour, now) -> "open" | "booked" | "past"
```

A small integer hash over `(courtId, dateISO, hour)` yields a stable value in 0–1, compared against a per-hour booking probability weighted so that 17:00–21:00 reads as scarce. The same court and date always produce the same result, so the flow never looks random when re-demoed.

Two deliberate constraints:

- **`now` is injected, never read inside.** This keeps the function pure and testable, and removes any dependence on wall-clock time at module scope.
- **Slot hours skip 14:00–15:00.** An outdoor Abuja court closing through the afternoon heat is a detail that rewards close inspection.

Booking dates are offered for the next 14 days.

### State

A reducer in `useBooking.ts`:

```
{ step, courtId, date, hour, name, email, phone }
```

Actions: `SELECT_COURT`, `SELECT_DATE`, `SELECT_HOUR`, `SET_FIELD`, `NEXT`, `BACK`, `CONFIRM`, `RESET`.

Court, date, and time auto-advance roughly 250ms after selection; BACK remains available throughout. Only the details step requires an explicit submit.

## Motion

The overlay wipes up over the page in navy, carrying the lime rail motif from the coach tabs. Steps crossfade on x, with a stagger across the court and time grids.

Reuse the page's existing vocabulary: `power3` easing and `cubic-bezier(.22, 1, .36, 1)`. Keep scale and position on **separate tweens** — collapsing properties into one tween forces them to share an ease, which is precisely how the ball-scene scale easing was lost during the original port.

Gate the entrance animation behind `prefers-reduced-motion`. The main page currently honours that only for `scroll-behavior`; adding a sixth scene that ignores it would widen an already-open gap.

## Accessibility

- `role="dialog"` with `aria-modal`.
- Focus trapped inside the overlay, and restored to the triggering CTA on close.
- ESC closes.
- Court and time grids navigable by arrow key.
- Booked slots carry `aria-disabled` with the reason in the accessible name, so the state is not communicated by colour alone.

## Error handling

The failure surface is small because nothing leaves the browser.

- Details step validates name, email, and phone inline on blur; submit stays disabled until valid.
- A slot that is `booked` or `past` is not selectable, so an invalid combination cannot be assembled.
- Reaching a later step without the earlier selections present redirects back to the first incomplete step. This is only reachable through a state bug, but it fails visibly rather than rendering a half-empty summary.

## Confirmation

The confirmation screen shows a generated booking reference. State resets when the overlay closes. Nothing claims an email was sent, because none was.

## Testing

The project has no test runner today. Add vitest covering `availability.ts` only:

- The same `(court, date, hour)` always yields the same state.
- Different courts on the same date diverge.
- Peak evening hours are booked more often than off-peak across a large sample.
- `past` is driven purely by the injected `now`.

Determinism is the property that breaks silently and invisibly, which is exactly what deserves a test. No component tests — for a page whose value is motion, they would cost more than they catch.
