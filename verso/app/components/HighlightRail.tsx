"use client";

import Image from "next/image";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import {
  DESKTOP_RAIL,
  MOBILE_RAIL,
  TABLET_RAIL,
  railLayout,
  railSpan,
  type RailConfig,
} from "../lib/rail";
import { WORKS } from "../content/works";
import { gsap, prefersReducedMotion, registerGsap } from "../lib/gsap";
import Ticker from "./Ticker";

function configFor(width: number): RailConfig {
  if (width < 768) return MOBILE_RAIL;
  if (width < 1200) return TABLET_RAIL;
  return DESKTOP_RAIL;
}

// useLayoutEffect warns when it runs on the server, since it never fires
// there. Falling back to useEffect for that pass is safe: SSR has no
// browser paint to race, so nothing is lost by not being "layout" yet.
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

export default function HighlightRail() {
  const stage = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const [config, setConfig] = useState<RailConfig>(DESKTOP_RAIL);

  // Resolve the config in its own effect, never inside the useGSAP that
  // drives the track: swapping the card count re-renders, and a tween that
  // has already captured the old elements would keep driving DOM nodes
  // React has thrown away. The configs are module constants, so identity
  // comparison is enough to keep resize from re-rendering on every pixel.
  useIsomorphicLayoutEffect(() => {
    const sync = () => {
      const next = configFor(window.innerWidth);
      setConfig((prev) => (prev === next ? prev : next));
    };
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, []);

  const layout = railLayout(config);

  useGSAP(
    () => {
      registerGsap();
      if (!track.current) return;

      const cards = gsap.utils.toArray<HTMLElement>(".rail-card", track.current);
      if (!cards.length) return;

      // Position first, unconditionally. GSAP owns the whole transform —
      // an inline one would be overwritten the moment a tween touches x,
      // taking y and scale (i.e. all the depth) with it.
      cards.forEach((card, i) => {
        gsap.set(card, {
          yPercent: -50,
          x: layout[i].x,
          y: layout[i].y,
          scale: layout[i].scale,
        });
      });

      // The rail is parked, not running. Scrolling through the section
      // slides it; when the page is still, so is the wall. An idle
      // autoplay would fight the hover, which is the actual interaction.
      if (prefersReducedMotion()) return;

      // Slide by whatever the strip overhangs the viewport by, so the far
      // end has arrived just as the section leaves and neither end sits
      // parked on screen. Centred, so mid-section is mid-strip.
      const overhang = Math.max(railSpan(config) - window.innerWidth, 0);
      const travel = Math.min(overhang, railSpan(config) * 0.5);
      gsap.fromTo(
        track.current,
        { x: travel / 2 },
        {
          x: -travel / 2,
          ease: "none",
          scrollTrigger: {
            trigger: stage.current,
            start: "top bottom",
            end: "bottom top",
            // A little scrub smooths the step between scroll events without
            // letting the strip drift once scrolling stops.
            scrub: 0.6,
          },
        },
      );
    },
    { scope: stage, dependencies: [config], revertOnUpdate: true },
  );

  return (
    <section
      ref={stage}
      className="relative flex h-screen flex-col justify-between overflow-clip pt-14 pb-4"
    >
      {/* pt-14 is the fixed nav's height. The wall still scrolls under the
          nav, as the source does, but the ticker does not: 12px muted
          uppercase interleaving with 16px muted nav labels reads as noise
          rather than as layers.

          z-10 on the two text edges: the stage is a positioned stacking
          context, so without it the near cards paint over the copy. */}
      <div className="relative z-10">
        <Ticker text="Highlight" />
      </div>

      <div className="rail-stage relative flex-1">
        <div className="rail absolute inset-0">
          {/* Decorative, and aria-hidden deliberately. The reference draws
              this in a canvas, so it is invisible to assistive tech there
              too; the readable listing is the grids below and All Works.
              Hover is mouse-only enrichment over that, not a second path
              to information — which is why there is nothing to focus. */}
          <div ref={track} className="rail-track" aria-hidden="true">
            {layout.map((card) => {
              const work = WORKS[card.index % WORKS.length];
              const height = Math.round(config.cardWidth * 1.26);
              return (
                <div
                  key={card.index}
                  className="rail-card"
                  style={{ width: config.cardWidth, height }}
                >
                  <div className="rail-card-in">
                    <Image
                      src={work.image}
                      alt=""
                      width={config.cardWidth}
                      height={height}
                      className="h-full w-full object-cover"
                      sizes={`${config.cardWidth}px`}
                    />
                    <div className="rail-cap">
                      <p className="text-[14px]" style={{ letterSpacing: "var(--track-16)" }}>
                        {work.title}
                      </p>
                      <p
                        className="mt-0.5 text-[12px]"
                        style={{ color: "rgb(255 255 255 / 0.66)", letterSpacing: "var(--track-12)" }}
                      >
                        {work.subtitle}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div
        className="relative z-10 mx-auto flex w-full max-w-(--content) items-center justify-between px-(--gutter) text-[16px]"
        style={{ letterSpacing: "var(--track-16)" }}
      >
        <span>Highlight</span>
        <span style={{ color: "var(--muted)" }}>View All</span>
      </div>
    </section>
  );
}
