"use client";

import { useEffect, useRef } from "react";
import type { Experiment } from "../../content/experiments";
import { getLenis } from "../lib/lenis";
import { MediaPlate } from "./MediaPlate";
import { ArrowUpRight } from "./icons";

/**
 * A rail of featured experiments, pinned while the page scrolls past it. The
 * focused card is full width and sharp; its neighbours narrow, blur and
 * desaturate with distance.
 *
 * Every per-card value is a function of one number — `focus`, a fractional
 * index derived from how far the page has scrolled through the section:
 *
 *   focus  = progress × (cards - 1)
 *   d      = clamp(|i - focus|, 0, 1)
 *   width  = lerp(MAX_W, MIN_W, d)
 *
 * Driving it from progress rather than from measured positions matters: card
 * widths decide the layout, so reading positions back to compute widths is a
 * feedback loop through the layout engine, which oscillates. This has no loop.
 *
 * `focus` is eased toward its target each frame instead of being snapped, so a
 * drag and a scroll produce the same motion rather than one feeling looser
 * than the other.
 */

const MAX_W = 0.43; // of viewport width, when focused — the reference's 620/1440
const MIN_W = 0.08; // when a full index away
const SHRUNK = MIN_W / MAX_W; // the reference's 110/620, kept when height-capped
const RATIO = 4 / 3; // the plate's aspect
const MAX_BLUR = 5; // px
const MAX_GRAY = 0.65;
const MIN_OPACITY = 0.65;
const GAP = 18; // px
const EASE = 0.12; // per frame, toward the scroll's target
const DRAG_SCALE = 1.35; // page pixels scrolled per pixel dragged

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export function FeaturedRail({ experiments }: { experiments: Experiment[] }) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLUListElement>(null);
  const cardRefs = useRef<Array<HTMLLIElement | null>>([]);

  useEffect(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    if (!section || !track) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    // The rail only exists from `lg` up. Below that it is display:none, so its
    // measurements are all zero and the loop would burn a frame every 16ms
    // computing nothing.
    const wide = window.matchMedia("(min-width: 1024px)");
    const count = experiments.length;
    let focus = 0;
    let raf = 0;

    /** Where the page must be for the rail to sit at `f`. */
    const scrollFor = (f: number) => {
      const { top, height } = section.getBoundingClientRect();
      const travel = height - window.innerHeight * 0.68;
      return top + window.scrollY + (f / (count - 1)) * travel;
    };

    const targetFocus = () => {
      const { top, height } = section.getBoundingClientRect();
      const travel = height - window.innerHeight * 0.68;
      if (travel <= 0) return 0;
      return clamp(-top / travel, 0, 1) * (count - 1);
    };

    const paint = () => {
      const vw = window.innerWidth;

      // A card is as wide as the viewport allows, but no taller than the
      // stage. Those are different axes: on a short, wide window 43vw of
      // 4:3 plate is taller than 68vh, and a card that overflows the stage
      // gets centred half of it behind the sticky nav. Height wins.
      const stage = track.closest<HTMLElement>("[data-stage]");
      const caption = cardRefs.current[0]?.querySelector<HTMLElement>("[data-caption]");
      const chrome = (caption?.offsetHeight ?? 0) + GAP;
      const room = (stage?.clientHeight ?? window.innerHeight) - chrome;

      const maxW = Math.max(120, Math.min(MAX_W * vw, room * RATIO));
      const minW = maxW * SHRUNK;

      const widths: number[] = [];
      for (let i = 0; i < count; i++) {
        const d = clamp(Math.abs(i - focus), 0, 1);
        const card = cardRefs.current[i];
        const w = lerp(maxW, minW, d);
        widths.push(w);
        if (!card) continue;

        card.style.width = `${w}px`;

        const media = card.querySelector<HTMLElement>("[data-plate]");
        if (media) {
          media.style.filter = `blur(${(d * MAX_BLUR).toFixed(2)}px) grayscale(${(
            d * MAX_GRAY
          ).toFixed(2)})`;
          media.style.opacity = lerp(1, MIN_OPACITY, d).toFixed(3);
        }

        // The caption belongs to whichever card is legible; it fades out well
        // before the card does, so a half-shrunk card isn't wearing a label.
        const caption = card.querySelector<HTMLElement>("[data-caption]");
        if (caption) {
          caption.style.opacity = clamp(1 - d * 2.2, 0, 1).toFixed(3);
        }
      }

      // Centre the rail on `focus`, interpolating between two card centres
      // when it sits between them.
      const centres: number[] = [];
      let x = 0;
      for (let i = 0; i < count; i++) {
        centres.push(x + widths[i] / 2);
        x += widths[i] + GAP;
      }
      const lo = Math.floor(focus);
      const hi = Math.min(lo + 1, count - 1);
      const centre = lerp(centres[lo], centres[hi], focus - lo);

      track.style.transform = `translate3d(${(vw / 2 - centre).toFixed(2)}px, 0, 0)`;
    };

    const frame = () => {
      const target = targetFocus();
      focus += (target - focus) * (reduced.matches ? 1 : EASE);
      if (Math.abs(target - focus) < 0.0005) focus = target;
      paint();
      raf = requestAnimationFrame(frame);
    };

    const start = () => {
      if (raf || !wide.matches || reduced.matches) return;
      focus = targetFocus();
      paint();
      raf = requestAnimationFrame(frame);
    };

    const stop = () => {
      if (!raf) return;
      cancelAnimationFrame(raf);
      raf = 0;
    };

    const onBreakpoint = () => (wide.matches && !reduced.matches ? start() : stop());

    start();
    wide.addEventListener("change", onBreakpoint);
    reduced.addEventListener("change", onBreakpoint);

    const onResize = () => {
      if (raf) paint();
    };
    window.addEventListener("resize", onResize);

    // --- drag ---------------------------------------------------------------
    // A drag moves the page, so scroll stays the single source of truth for
    // where the rail is. Going through Lenis rather than window.scrollTo keeps
    // the smoothing from immediately pulling the page back.
    let dragging = false;
    let startX = 0;
    let startScroll = 0;
    let moved = 0;

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0 || reduced.matches) return;
      dragging = true;
      moved = 0;
      startX = e.clientX;
      startScroll = window.scrollY;
      // Throws if the pointer has already been released — a stray pointerdown
      // from a device that reports its buttons oddly, or a synthetic event.
      try {
        track.setPointerCapture(e.pointerId);
      } catch {
        /* capture is an optimisation; the drag still tracks without it */
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      moved = Math.max(moved, Math.abs(dx));
      const to = startScroll - dx * DRAG_SCALE;
      const lenis = getLenis();
      if (lenis) lenis.scrollTo(to, { immediate: true });
      else window.scrollTo(0, to);
    };

    const endDrag = (e: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      try {
        if (track.hasPointerCapture(e.pointerId)) {
          track.releasePointerCapture(e.pointerId);
        }
      } catch {
        /* already released */
      }
    };

    // A drag that ends on a card must not also open it.
    const onClickCapture = (e: MouseEvent) => {
      if (moved > 6) {
        e.preventDefault();
        e.stopPropagation();
        moved = 0;
      }
    };

    track.addEventListener("pointerdown", onPointerDown);
    track.addEventListener("pointermove", onPointerMove);
    track.addEventListener("pointerup", endDrag);
    track.addEventListener("pointercancel", endDrag);
    track.addEventListener("click", onClickCapture, true);

    // Keyboard focus must bring its card into view rather than leaving the
    // reader looking at a blurred thumbnail.
    const onFocusIn = (e: FocusEvent) => {
      const card = (e.target as HTMLElement).closest("li");
      const i = cardRefs.current.indexOf(card as HTMLLIElement);
      if (i < 0) return;
      const lenis = getLenis();
      const to = scrollFor(i);
      if (lenis) lenis.scrollTo(to);
      else window.scrollTo({ top: to, behavior: "smooth" });
    };
    track.addEventListener("focusin", onFocusIn);

    return () => {
      stop();
      wide.removeEventListener("change", onBreakpoint);
      reduced.removeEventListener("change", onBreakpoint);
      window.removeEventListener("resize", onResize);
      track.removeEventListener("pointerdown", onPointerDown);
      track.removeEventListener("pointermove", onPointerMove);
      track.removeEventListener("pointerup", endDrag);
      track.removeEventListener("pointercancel", endDrag);
      track.removeEventListener("click", onClickCapture, true);
      track.removeEventListener("focusin", onFocusIn);
    };
  }, [experiments]);

  return (
    <div
      ref={sectionRef}
      // Stage is 68vh; each transition gets 70vh of scroll to happen in.
      style={{ height: `calc(68vh + ${(experiments.length - 1) * 70}vh)` }}
      className="relative"
    >
      <div data-stage className="sticky top-24 h-[68vh] overflow-hidden">
        <div className="flex h-full items-center">
          <ul
            ref={trackRef}
            className="flex cursor-grab touch-pan-y items-center will-change-transform select-none active:cursor-grabbing"
            style={{ gap: `${GAP}px` }}
          >
            {experiments.map((experiment, i) => (
              <li
                key={experiment.slug}
                ref={(el) => {
                  cardRefs.current[i] = el;
                }}
                className="relative shrink-0"
                // Before the effect runs, the first card is focused and the
                // rest sit at their narrow width — the same state as focus = 0.
                style={{ width: i === 0 ? `${MAX_W * 100}vw` : `${MIN_W * 100}vw` }}
              >
                <div
                  data-caption
                  className="mb-3 flex items-center justify-between gap-4 rounded-xl bg-foreground px-4 py-2.5"
                  style={{ opacity: i === 0 ? 1 : 0 }}
                >
                  <span className="truncate text-sm font-medium text-background">
                    {experiment.title}
                  </span>
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
                    view <ArrowUpRight width={12} height={12} />
                  </span>
                </div>

                {/* Plain anchor, never next/link — see app/page.test.ts. */}
                <a
                  href={`/notes/${experiment.slug}/`}
                  className="block"
                  draggable={false}
                  aria-label={`${experiment.title} — ${experiment.blurb}`}
                >
                  <div
                    data-plate
                    className="relative aspect-4/3 w-full overflow-hidden rounded-xl border border-border"
                    style={{
                      filter: i === 0 ? undefined : `blur(${MAX_BLUR}px) grayscale(${MAX_GRAY})`,
                      opacity: i === 0 ? 1 : MIN_OPACITY,
                    }}
                  >
                    <MediaPlate experiment={experiment} />
                  </div>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
