"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import {
  DESKTOP_RAIL,
  MOBILE_RAIL,
  TABLET_RAIL,
  railLayout,
  railSpan,
  wrapX,
  type RailConfig,
} from "../lib/rail";
import { WORKS } from "../content/works";
import { gsap, ScrollTrigger, prefersReducedMotion, registerGsap } from "../lib/gsap";
import Ticker from "./Ticker";

function configFor(width: number): RailConfig {
  if (width < 768) return MOBILE_RAIL;
  if (width < 1200) return TABLET_RAIL;
  return DESKTOP_RAIL;
}

export default function HighlightRail() {
  const stage = useRef<HTMLElement>(null);
  const rail = useRef<HTMLDivElement>(null);
  const [config, setConfig] = useState<RailConfig>(DESKTOP_RAIL);

  // Resolve the config in its own effect, never inside the useGSAP that
  // builds the loop: swapping the card count re-renders, and a tween that
  // has already captured the old elements would keep driving DOM nodes
  // React has thrown away. The configs are module constants, so identity
  // comparison is enough to keep resize from re-rendering on every pixel.
  useEffect(() => {
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
      if (!rail.current) return;

      const cards = gsap.utils.toArray<HTMLElement>(".rail-card", rail.current);
      if (!cards.length) return;

      // Position first, unconditionally. GSAP owns the whole transform —
      // an inline one would be overwritten the moment the loop touches x,
      // taking y and scale (i.e. all the depth) with it.
      cards.forEach((card, i) => {
        gsap.set(card, {
          xPercent: 0,
          yPercent: -50,
          x: layout[i].x,
          y: layout[i].y,
          scale: layout[i].scale,
        });
      });

      // Reduced motion stops the drift, not the wall: the cards above are
      // already laid out, so the rail stays a legible static composition.
      if (prefersReducedMotion()) return;

      const span = railSpan(config);

      // One tween per card, each wrapped independently. Wrapping the whole
      // rail would snap the entire strip at the seam; wrapping each card
      // means only that card recycles, off-screen, invisibly.
      //
      // wrapX folds into [0, span); shifting by two card widths either side
      // moves the recycle point clear of both edges of the projection — the
      // near end exits past the left edge, the far end is reborn well past
      // the right one.
      const margin = config.cardWidth * 2;
      const loop = gsap.to(cards, {
        x: `-=${span}`,
        duration: 60,
        ease: "none",
        repeat: -1,
        modifiers: {
          x: (x) => `${wrapX(parseFloat(x) + margin, span) - margin}px`,
        },
      });

      // Scroll does not scrub the loop, it leans on it: the wall drifts by
      // itself and surges while you move. The surge target decays on the
      // ticker rather than in an onUpdate tween, because onUpdate stops
      // firing the instant scrolling stops — which would strand the wall at
      // whatever speed it was doing when you let go.
      let target = 1;
      const trigger = ScrollTrigger.create({
        trigger: stage.current,
        start: "top bottom",
        end: "bottom top",
        onUpdate: (self) => {
          target = 1 + Math.min(Math.abs(self.getVelocity()) / 1200, 5);
        },
      });

      const settle = () => {
        target += (1 - target) * 0.03;
        loop.timeScale(loop.timeScale() + (target - loop.timeScale()) * 0.08);
      };
      gsap.ticker.add(settle);

      return () => {
        gsap.ticker.remove(settle);
        trigger.kill();
        loop.kill();
      };
    },
    { scope: stage, dependencies: [config], revertOnUpdate: true },
  );

  return (
    <section
      ref={stage}
      className="relative flex h-screen flex-col justify-between overflow-clip py-4"
    >
      {/* z-10 on the two text edges: the stage is a positioned stacking
          context, so without it the near cards paint over the copy. */}
      <div className="relative z-10">
        <Ticker text="Highlight" />
      </div>

      <div className="rail-stage relative flex-1">
        {/* Decorative: every work here is already linked from the grids below,
            and the detail routes do not exist in this phase. */}
        <div ref={rail} className="rail absolute inset-0" aria-hidden="true">
          {layout.map((card) => {
            const work = WORKS[card.index % WORKS.length];
            return (
              <div
                key={card.index}
                className="rail-card"
                style={{
                  width: config.cardWidth,
                  height: Math.round(config.cardWidth * 1.26),
                }}
              >
                <Image
                  src={work.image}
                  alt=""
                  width={config.cardWidth}
                  height={Math.round(config.cardWidth * 1.26)}
                  className="h-full w-full object-cover"
                  sizes={`${config.cardWidth}px`}
                />
              </div>
            );
          })}
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
