"use client";

import Image from "next/image";
import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, prefersReducedMotion, registerGsap } from "../lib/gsap";
import { WORKS } from "../content/works";
import { REEL } from "../content/site";
import { LEGAL } from "../content/site";

const SHOT = 2.4; // seconds a beat holds
const FADE = 0.7; // crossfade between beats

const FRAMES = REEL.map((beat) => {
  const work = WORKS.find((w) => w.slug === beat.slug);
  if (!work) throw new Error(`Reel references unknown work: ${beat.slug}`);
  return { ...beat, image: work.image };
});

export default function HeroReel() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      registerGsap();
      // Reduced motion keeps the first beat on screen as a still hero. The
      // frames are hidden in CSS rather than JS here, deliberately: the reel
      // is decorative and aria-hidden, and with no JS at all the first frame
      // alone is a perfectly good static hero.
      if (prefersReducedMotion()) return;

      const frames = gsap.utils.toArray<HTMLElement>(".reel-frame", root.current);
      const words = gsap.utils.toArray<HTMLElement>(".reel-word", root.current);
      const shots = gsap.utils.toArray<HTMLElement>(".reel-img", root.current);
      const bar = root.current?.querySelector(".reel-bar-fill");
      if (!frames.length) return;

      gsap.set(frames, { opacity: 0 });
      gsap.set(frames[0], { opacity: 1 });

      const tl = gsap.timeline({ repeat: -1, defaults: { ease: "power2.inOut" } });

      frames.forEach((frame, i) => {
        const at = i * SHOT;
        const next = frames[(i + 1) % frames.length];

        // A slow push on every still, so no beat is ever truly still.
        tl.fromTo(shots[i], { scale: 1 }, { scale: 1.1, duration: SHOT + FADE, ease: "none" }, at);
        tl.fromTo(
          words[i],
          { yPercent: 45, opacity: 0 },
          { yPercent: 0, opacity: 1, duration: 0.65 },
          at + 0.1,
        );
        tl.to(words[i], { yPercent: -28, opacity: 0, duration: 0.45 }, at + SHOT - 0.4);
        tl.to(frame, { opacity: 0, duration: FADE }, at + SHOT - FADE / 2);
        tl.to(next, { opacity: 1, duration: FADE }, at + SHOT - FADE / 2);
      });

      if (bar) {
        tl.fromTo(bar, { scaleX: 0 }, { scaleX: 1, duration: frames.length * SHOT, ease: "none" }, 0);
      }

      // Pin the total so the last beat hands back to the first cleanly
      // rather than the trailing crossfade extending the loop.
      tl.duration(frames.length * SHOT);
    },
    { scope: root },
  );

  return (
    <div
      ref={root}
      className="reel relative h-[70vh] w-full overflow-hidden md:h-[85vh]"
      aria-hidden="true"
    >
      {FRAMES.map((frame) => (
        <div key={frame.slug} className="reel-frame">
          <Image
            src={frame.image}
            alt=""
            fill
            priority={frame.slug === FRAMES[0].slug}
            className="reel-img object-cover"
            sizes="100vw"
          />
          <div className="reel-scrim" />
          <div className="reel-copy">
            <p
              className={frame.mark ? "reel-word reel-word--mark" : "reel-word"}
              style={{ letterSpacing: "var(--track-48)" }}
            >
              {frame.word}
            </p>
            {frame.mark ? (
              <p className="reel-sub" style={{ letterSpacing: "0.14em" }}>
                {LEGAL.signoff}
              </p>
            ) : null}
          </div>
        </div>
      ))}

      <div className="reel-bar">
        <div className="reel-bar-fill" />
      </div>
    </div>
  );
}
