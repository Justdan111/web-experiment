"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { broadcastPointer } from "./pointer";

/** Replaces the system cursor with a little racket that trails the pointer. */
export default function RacketCursor() {
  const ref = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    gsap.set(el, { xPercent: -50, yPercent: -50 });
    const xTo = gsap.quickTo(el, "x", { duration: 0.18, ease: "power3" });
    const yTo = gsap.quickTo(el, "y", { duration: 0.18, ease: "power3" });

    let armed = false;
    const move = (e: PointerEvent) => {
      if (!armed) {
        armed = true;
        gsap.set(el, { x: e.clientX, y: e.clientY });
        el.classList.add("on");
      }
      xTo(e.clientX);
      yTo(e.clientY);
      broadcastPointer(e.clientX, e.clientY);
    };
    const leave = () => {
      armed = false;
      el.classList.remove("on");
      broadcastPointer(null, null);
    };

    window.addEventListener("pointermove", move);
    document.addEventListener("pointerleave", leave);
    return () => {
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerleave", leave);
    };
  }, []);

  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      ref={ref}
      className="racket-cursor"
      src="/media/racket-cursor.png"
      alt=""
      aria-hidden="true"
    />
  );
}
