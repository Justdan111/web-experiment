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
  wrapX,
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

      if (prefersReducedMotion()) return;

      // The cursor drives the strip; scroll is left entirely alone so the
      // page scrolls normally through the section. Pointer distance from
      // the centre sets a speed rather than a position, so the strip keeps
      // travelling for as long as the cursor sits off-centre, and the
      // middle is a dead zone you can rest in to hover a card.
      const span = railSpan(config);
      const step = config.cardWidth + config.gap;
      // Recycle two cards clear of either edge so no card is ever seen
      // being reborn inside the viewport.
      const margin = step * 2;
      const DEAD_ZONE = 0.14;
      const MAX_SPEED = 520; // px/sec at full deflection

      let wanted = 0;
      let speed = 0;
      let offset = 0;

      const aim = (clientX: number) => {
        const box = stage.current?.getBoundingClientRect();
        if (!box) return;
        const from = (clientX - box.left) / box.width - 0.5; // -0.5..0.5
        const pull = Math.abs(from) * 2;
        if (pull <= DEAD_ZONE) {
          wanted = 0;
          return;
        }
        const ramp = (pull - DEAD_ZONE) / (1 - DEAD_ZONE);
        // Cursor right of centre pulls the strip left, so the cards travel
        // toward the pointer rather than away from it.
        wanted = -Math.sign(from) * ramp * MAX_SPEED;
      };

      const onMove = (e: PointerEvent) => aim(e.clientX);
      const onLeave = () => {
        wanted = 0;
      };

      const el = stage.current;
      el?.addEventListener("pointermove", onMove);
      el?.addEventListener("pointerleave", onLeave);

      const drive = () => {
        // Ease toward the wanted speed so entering and leaving the section
        // spins up and coasts down instead of snapping.
        speed += (wanted - speed) * 0.07;
        if (Math.abs(speed) < 0.01) return;
        offset += speed * gsap.ticker.deltaRatio() * (1 / 60);
        cards.forEach((card, i) => {
          gsap.set(card, { x: wrapX(layout[i].x + offset + margin, span) - margin });
        });
      };
      gsap.ticker.add(drive);

      return () => {
        gsap.ticker.remove(drive);
        el?.removeEventListener("pointermove", onMove);
        el?.removeEventListener("pointerleave", onLeave);
      };
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
              const height = Math.round(config.cardWidth * 1.55);
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
