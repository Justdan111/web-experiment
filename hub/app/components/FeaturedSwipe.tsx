"use client";

import { useEffect, useRef, useState } from "react";
import type { Experiment } from "../../content/experiments";
import { MediaPlate } from "./MediaPlate";
import { ArrowUpRight } from "./icons";

/**
 * The narrow-screen Recent rail. Same focus effect as the pinned desktop one —
 * the centred card is sharp, its neighbours blur and shrink — but you move it
 * with your thumb rather than by scrolling the page.
 *
 * A native overflow scroller with snap points, not a hand-rolled gesture: it
 * inherits momentum, rubber-banding and the platform's own feel for free, and
 * it adds nothing to the page's height.
 *
 * Card widths are fixed here and the shrink is a transform. On the desktop rail
 * the width itself interpolates, which is fine because that rail is driven by
 * scroll progress rather than by measurement — here the values are read back
 * from live positions, so anything that changed the layout would feed into
 * itself. Scale does not.
 */

const CARD_VW = 78; // of viewport width
const GAP = 16; // px
const MIN_SCALE = 0.84;
const MAX_BLUR = 5; // px
const MAX_GRAY = 0.65;
const MIN_OPACITY = 0.65;

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export function FeaturedSwipe({ experiments }: { experiments: Experiment[] }) {
  const scrollerRef = useRef<HTMLUListElement>(null);
  const cardRefs = useRef<Array<HTMLLIElement | null>>([]);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    // The scroller is user-driven, so it stays. The blur and shrink are
    // decoration on top of it, and that is the part to drop.
    const plain = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let raf = 0;

    const paint = () => {
      raf = 0;
      const box = scroller.getBoundingClientRect();
      const centre = box.left + box.width / 2;

      let nearest = 0;
      let nearestD = Infinity;

      cardRefs.current.forEach((card, i) => {
        if (!card) return;
        const r = card.getBoundingClientRect();
        const offset = Math.abs(r.left + r.width / 2 - centre);
        // One card-and-gap away is fully out of focus.
        const d = clamp(offset / (r.width + GAP), 0, 1);

        if (offset < nearestD) {
          nearestD = offset;
          nearest = i;
        }

        if (plain) return;

        const plate = card.querySelector<HTMLElement>("[data-plate]");
        if (plate) {
          plate.style.filter = `blur(${(d * MAX_BLUR).toFixed(2)}px) grayscale(${(
            d * MAX_GRAY
          ).toFixed(2)})`;
          plate.style.opacity = lerp(1, MIN_OPACITY, d).toFixed(3);
        }

        card.style.transform = `scale(${lerp(1, MIN_SCALE, d).toFixed(4)})`;

        const caption = card.querySelector<HTMLElement>("[data-caption]");
        if (caption) caption.style.opacity = clamp(1 - d * 2.2, 0, 1).toFixed(3);
      });

      setActive(nearest);
    };

    const onScroll = () => {
      // One paint per frame however fast the finger is moving.
      if (!raf) raf = requestAnimationFrame(paint);
    };

    paint();
    scroller.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      scroller.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [experiments]);

  const goTo = (i: number) => {
    const card = cardRefs.current[i];
    card?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  };

  return (
    <div>
      <ul
        ref={scrollerRef}
        className="flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{
          gap: `${GAP}px`,
          // Lets the first and last card reach the middle of the screen.
          paddingInline: `calc(50vw - ${CARD_VW / 2}vw)`,
        }}
      >
        {experiments.map((experiment, i) => (
          <li
            key={experiment.slug}
            ref={(el) => {
              cardRefs.current[i] = el;
            }}
            className="shrink-0 snap-center"
            style={{ width: `${CARD_VW}vw` }}
          >
            <div
              data-caption
              className="mb-3 flex items-center justify-between gap-3 rounded-xl bg-foreground px-3.5 py-2.5"
            >
              <span className="truncate text-sm font-medium text-background">
                {experiment.title}
              </span>
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground">
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
              >
                <MediaPlate experiment={experiment} />
              </div>
            </a>
          </li>
        ))}
      </ul>

      <div className="mt-5 flex justify-center gap-2">
        {experiments.map((experiment, i) => (
          <button
            key={experiment.slug}
            type="button"
            onClick={() => goTo(i)}
            aria-label={`Show ${experiment.title}`}
            aria-current={i === active}
            className="h-1.5 rounded-full bg-foreground transition-all duration-300"
            style={{ width: i === active ? 20 : 6, opacity: i === active ? 1 : 0.25 }}
          />
        ))}
      </div>
    </div>
  );
}
