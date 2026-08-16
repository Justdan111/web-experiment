"use client";

import { useRef, type CSSProperties, type ReactNode } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, prefersReducedMotion, registerGsap } from "../lib/gsap";

type Props = {
  children: ReactNode;
  /** Stagger direct children instead of revealing the block as one. */
  stagger?: boolean;
  delay?: number;
  className?: string;
  /** Grid sections pass grid-template-columns through here. */
  style?: CSSProperties;
};

export default function Reveal({ children, stagger, delay = 0, className, style }: Props) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      registerGsap();
      if (prefersReducedMotion()) return;

      const targets = stagger
        ? Array.from(root.current?.children ?? [])
        : [root.current];
      if (!targets.length) return;

      gsap.from(targets, {
        autoAlpha: 0,
        y: 24,
        duration: 0.8,
        ease: "power3.out",
        delay,
        stagger: stagger ? 0.08 : 0,
        scrollTrigger: {
          trigger: root.current,
          start: "top 85%",
          once: true,
        },
      });
    },
    { scope: root },
  );

  return (
    <div ref={root} className={className} style={style}>
      {children}
    </div>
  );
}
