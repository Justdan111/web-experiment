"use client";

import { useEffect, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, prefersReducedMotion, registerGsap } from "../lib/gsap";

export default function Ticker({ text, repeat = 12 }: { text: string; repeat?: number }) {
  const track = useRef<HTMLDivElement>(null);
  const [count, setCount] = useState(repeat);

  // The -50% loop only reads as continuous while one half is at least as
  // wide as the viewport — otherwise the track runs out mid-travel and
  // leaves a bald patch on wide screens. Measure a single item and add
  // copies until half the track covers the screen. Only ever grows, so
  // this settles after one pass.
  useEffect(() => {
    const el = track.current;
    const fit = () => {
      if (!el || !el.scrollWidth) return;
      const item = el.scrollWidth / (count * 2);
      const need = Math.ceil(window.innerWidth / item) + 1;
      setCount((c) => (need > c ? need : c));
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [count]);

  useGSAP(
    () => {
      registerGsap();
      if (!track.current || prefersReducedMotion()) return;

      // Two identical halves; travelling exactly -50% lands the second half
      // where the first began, so the loop has no seam.
      gsap.to(track.current, {
        xPercent: -50,
        duration: 40,
        ease: "none",
        repeat: -1,
      });
    },
    { scope: track },
  );

  const items = Array.from({ length: count * 2 }, (_, i) => (
    <span key={i} className="px-6 text-[12px] uppercase" style={{ letterSpacing: "var(--track-12)" }}>
      {text}
    </span>
  ));

  return (
    <div className="overflow-hidden" aria-hidden="true">
      <div ref={track} className="flex w-max whitespace-nowrap" style={{ color: "var(--muted)" }}>
        {items}
      </div>
    </div>
  );
}
